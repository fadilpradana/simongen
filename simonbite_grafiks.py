import pymysql
from sshtunnel import SSHTunnelForwarder
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import pandas as pd
from datetime import datetime, timedelta, time as dt_time
import pytz # Untuk timezone handling
import requests # Untuk mengirim ke Telegram
import os # Untuk path file gambar

# --- Konfigurasi Server dan Database ---
SSH_HOST = '172.20.100.100'
SSH_USERNAME = 'root'
SSH_PASSWORD = 'eecj8389' # Harap ganti dengan metode yang lebih aman
SSH_PORT = 22

MYSQL_HOST_REMOTE = '127.0.0.1'
MYSQL_PORT_REMOTE = 3306
MYSQL_USER = 'edge'
MYSQL_PASSWORD = 'eecRadar' # Harap ganti dengan metode yang lebih aman
MYSQL_DATABASE = 'EdgeBite'
TABLE_NAME = 'ddcbite'

# --- Konfigurasi Kolom (0-based index) ---
TIME_COLUMN_NAME_IN_DB = 'time' 

CABINET_TEMP_COL_INDEX = 16
HOT_BOX_TEMP_COL_INDEX = 17
HVPS_V_COL_INDEX = 20
HVPS_I_COL_INDEX = 21
MAG_I_COL_INDEX = 22
FORWARD_POWER_COL_INDEX = 27
REVERSE_POWER_COL_INDEX = 28
VSWR_COL_INDEX = 29

# --- Konfigurasi Parameter Grafik ---
PARAMETERS_CONFIG = [
    {'label': 'Forward Power', 'index': FORWARD_POWER_COL_INDEX, 'unit': 'Power', 'limits': (81.5, 85), 'color': 'blue'},
    {'label': 'Reverse Power', 'index': REVERSE_POWER_COL_INDEX, 'unit': 'Power', 'limits': (39, 64), 'color': 'green'},
    {'label': 'Cabinet Temp', 'index': CABINET_TEMP_COL_INDEX, 'unit': '°C', 'limits': (0.5, 31.5), 'color': 'red'},
    {'label': 'Hot Box Temp', 'index': HOT_BOX_TEMP_COL_INDEX, 'unit': '°C', 'limits': (0.5, 31.5), 'color': 'orange'},
    {'label': 'HVPS V', 'index': HVPS_V_COL_INDEX, 'unit': 'V', 'limits': (649.5, 714.5), 'color': 'purple'},
    {'label': 'HVPS I', 'index': HVPS_I_COL_INDEX, 'unit': 'I', 'limits': (0.3, 8), 'color': 'brown'},
    {'label': 'MAG I', 'index': MAG_I_COL_INDEX, 'unit': 'I', 'limits': (4.5, 59.5), 'color': 'magenta'},
    {'label': 'VSWR', 'index': VSWR_COL_INDEX, 'unit': 'Ratio', 'limits': (0.5, 1.20), 'color': 'cyan'},
]

# --- Konfigurasi Telegram ---
TELEGRAM_CHAT_ID = '-1002449239635'
TELEGRAM_TOKEN = '694548757:AAFhtqcduAUH5v0vk0zCQzZkgxrdIXAuGk4' # Harap ganti dengan metode yang lebih aman
IMAGE_FILENAME = 'grafik_radar_harian.png'


def get_utc_yesterday_range():
    """Mendapatkan rentang waktu untuk kemarin dari 00:00 UTC hingga 23:59:59 UTC."""
    today_utc = datetime.now(pytz.utc)
    yesterday_utc = today_utc - timedelta(days=1)
    
    start_time = datetime.combine(yesterday_utc.date(), dt_time.min, tzinfo=pytz.utc)
    end_time = datetime.combine(yesterday_utc.date(), dt_time.max, tzinfo=pytz.utc)
    
    return start_time, end_time, yesterday_utc.date()

def fetch_radar_data_for_period(server, start_utc, end_utc):
    """Mengambil data dari database MySQL untuk periode waktu tertentu."""
    conn = None
    all_required_indices = [p['index'] for p in PARAMETERS_CONFIG]

    try:
        conn = pymysql.connect(
            host='127.0.0.1',
            port=server.local_bind_port,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            cursorclass=pymysql.cursors.DictCursor 
        )
        print(f"Berhasil terhubung ke database. Mengambil data untuk periode {start_utc} hingga {end_utc}")

        with conn.cursor() as cursor:
            query = f"""
                SELECT * FROM {TABLE_NAME} 
                WHERE `{TIME_COLUMN_NAME_IN_DB}` BETWEEN %s AND %s 
                ORDER BY `{TIME_COLUMN_NAME_IN_DB}` ASC
            """
            cursor.execute(query, (start_utc, end_utc))
            results = cursor.fetchall()

            if not results:
                print("Tidak ada data yang ditemukan untuk periode yang ditentukan.")
                return None

            df = pd.DataFrame(results)
            print(f"Berhasil mengambil {len(df)} data poin.")

            if TIME_COLUMN_NAME_IN_DB not in df.columns:
                if len(df.columns) > 0 and TIME_COLUMN_NAME_IN_DB != df.columns[0]:
                    print(f"Peringatan: Kolom '{TIME_COLUMN_NAME_IN_DB}' tidak ditemukan. Menggunakan kolom pertama '{df.columns[0]}' sebagai waktu.")
                    df.rename(columns={df.columns[0]: 'timestamp'}, inplace=True)
                else:
                     print(f"Error: Kolom waktu '{TIME_COLUMN_NAME_IN_DB}' tidak ditemukan di hasil query.")
                     return None
            else:
                df.rename(columns={TIME_COLUMN_NAME_IN_DB: 'timestamp'}, inplace=True)
            
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            if df['timestamp'].dt.tz is None:
                df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
            else:
                df['timestamp'] = df['timestamp'].dt.tz_convert('UTC')

            for param_config in PARAMETERS_CONFIG:
                col_label_safe = param_config['label'].lower().replace(' ', '_').replace('°', '')
                if param_config['index'] >= len(df.columns):
                    print(f"Error: Indeks kolom {param_config['index']} ({param_config['label']}) di luar jangkauan. Jumlah kolom: {len(df.columns)}")
                    df[col_label_safe] = pd.NA 
                    continue
                df[col_label_safe] = pd.to_numeric(df.iloc[:, param_config['index']], errors='coerce')
            
            return df

    except pymysql.Error as e:
        print(f"Error koneksi atau query database: {e}")
        return None
    except Exception as e:
        print(f"Terjadi error saat mengambil data: {e}")
        return None
    finally:
        if conn:
            conn.close()

# VVVVV PERBAIKAN DI FUNGSI INI VVVVVV
def plot_data(df, plot_date_str):
    """Membuat dan menyimpan grafik dari data yang diberikan."""
    if df is None or df.empty:
        print("Tidak ada data untuk diplot.")
        return False

    num_params = len(PARAMETERS_CONFIG)
    fig, axs = plt.subplots(4, 2, figsize=(18, 22), sharex=True) 
    axs = axs.flatten() 

    fig.suptitle(f"Grafik Parameter Radar Cuaca - {plot_date_str} (UTC)", fontsize=16, y=0.99)

    for i, param_config in enumerate(PARAMETERS_CONFIG):
        ax = axs[i]
        col_label_safe = param_config['label'].lower().replace(' ', '_').replace('°', '')
        
        current_param_label = param_config['label']
        current_param_unit = param_config['unit']

        if col_label_safe not in df.columns or df[col_label_safe].isnull().all():
            ax.text(0.5, 0.5, 'Data tidak tersedia', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes)
            ax.set_title(f"{current_param_label} ({current_param_unit})")
            ax.set_yticks([]) 
        else:
            ax.plot(df['timestamp'], df[col_label_safe], label=current_param_label, color=param_config['color'], linestyle='-')
            
            # Mengekstrak nilai batas ke variabel sementara
            lower_limit_val = param_config['limits'][0]
            upper_limit_val = param_config['limits'][1]
            
            # Menggunakan variabel sementara di dalam f-string
            ax.axhline(y=upper_limit_val, color='r', linestyle='--', label=f'Batas Atas ({upper_limit_val})')
            ax.axhline(y=lower_limit_val, color='darkgreen', linestyle='--', label=f'Batas Bawah ({lower_limit_val})')
            
            ax.set_title(f"{current_param_label} ({current_param_unit})")
            ax.set_ylabel(current_param_unit)
            ax.legend(fontsize='small')
        
        ax.grid(True)

    last_ax_with_data = axs[-1] 
    last_ax_with_data.set_xlabel('Waktu (UTC)', fontsize=12)
    
    utc_formatter = mdates.DateFormatter('%H:%M', tz=pytz.utc) 
    last_ax_with_data.xaxis.set_major_formatter(utc_formatter)
    last_ax_with_data.xaxis.set_major_locator(mdates.HourLocator(interval=2)) 
    fig.autofmt_xdate(rotation=45) 

    plt.tight_layout(rect=[0, 0, 1, 0.97]) 

    try:
        # plt.savefig(IMAGE_FILENAME)
        IMAGE_FILENAME = '/home/opmet/grafik_radar_harian.png'
        plt.savefig(IMAGE_FILENAME)

        print(f"Grafik berhasil disimpan sebagai grafik_radar_harian.png")
        return True
    except Exception as e:
        print(f"Gagal menyimpan grafik: {e}")
        return False
# ^^^^^ PERBAIKAN DI FUNGSI INI ^^^^^

def send_telegram_photo(image_path, caption=""):
    """Mengirim foto ke Telegram."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
    try:
        with open(image_path, 'rb') as photo_file:
            files = {'photo': photo_file}
            data = {'chat_id': TELEGRAM_CHAT_ID, 'caption': caption}
            response = requests.post(url, files=files, data=data, timeout=30)
            response.raise_for_status() 
            print("Grafik berhasil dikirim ke Telegram.")
            return True
    except requests.exceptions.RequestException as e:
        print(f"Gagal mengirim grafik ke Telegram: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Telegram response: {e.response.text}")
        return False
    except FileNotFoundError:
        print(f"File gambar tidak ditemukan: {image_path}")
        return False
    except Exception as e:
        print(f"Terjadi error tak terduga saat mengirim ke Telegram: {e}")
        return False

if __name__ == '__main__':
    start_utc, end_utc, plot_date = get_utc_yesterday_range()
    plot_date_str = plot_date.strftime("%Y-%m-%d")
    print(f"Akan membuat grafik untuk tanggal: {plot_date_str} UTC")

    print(f"Mencoba membuat SSH tunnel ke {SSH_HOST}...")
    try:
        with SSHTunnelForwarder(
            (SSH_HOST, SSH_PORT),
            ssh_username=SSH_USERNAME,
            ssh_password=SSH_PASSWORD,
            remote_bind_address=(MYSQL_HOST_REMOTE, MYSQL_PORT_REMOTE)
        ) as server:
            print(f"SSH tunnel aktif. Terhubung ke port lokal {server.local_bind_port} untuk MySQL.")
            
            radar_df = fetch_radar_data_for_period(server, start_utc, end_utc)

            if radar_df is not None and not radar_df.empty:
                if plot_data(radar_df, plot_date_str):
                    telegram_caption = f"Grafik Parameter Radar Cuaca\nTanggal: {plot_date_str} (UTC)"
                    send_telegram_photo(IMAGE_FILENAME, caption=telegram_caption)
            else:
                print("Tidak ada data untuk diplot, atau terjadi error saat mengambil data.")
                error_message = f"Tidak ada data radar yang ditemukan untuk tanggal {plot_date_str} (UTC) untuk pembuatan grafik."
                url_text = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
                payload_text = {'chat_id': TELEGRAM_CHAT_ID, 'text': error_message}
                try:
                    requests.post(url_text, data=payload_text, timeout=10)
                    print("Pesan 'tidak ada data' dikirim ke Telegram.")
                except Exception as e_tg_text:
                    print(f"Gagal mengirim pesan teks 'tidak ada data' ke Telegram: {e_tg_text}")

    except Exception as e:
        print(f"Gagal membuat SSH tunnel atau menjalankan proses utama: {e}")

    finally:
        # if os.path.exists(IMAGE_FILENAME):
        #     os.remove(IMAGE_FILENAME)
        #     print(f"File gambar {IMAGE_FILENAME} telah dihapus.")
        pass

    print("Skrip selesai.")