# --- START OF MODIFIED simonbite_grafiks.py ---

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
# TELEGRAM_TOKEN = '629138334:AAHu9FaOVzJaiuUfMz0zHyAEGfDMIJBR1oA'
# TELEGRAM_CHAT_ID = '79888740'
TELEGRAM_CHAT_ID = '-1002449239635' # Ganti dengan ID chat Anda jika perlu
TELEGRAM_TOKEN = '694548757:AAFhtqcduAUH5v0vk0zCQzZkgxrdIXAuGk4' # Harap ganti dengan token bot Anda
# IMAGE_FILENAME = 'grafik_radar_harian.png' # Akan diatur path lengkap di plot_data

# --- Global variable for image path ---
# Menggunakan path absolut untuk menghindari masalah direktori kerja
# Pastikan direktori /home/opmet/ dapat ditulis oleh user yang menjalankan skrip
IMAGE_STORAGE_PATH = '/home/opmet/' 
# IMAGE_STORAGE_PATH = r'G:\\Python' 
IMAGE_FILENAME_ONLY = 'grafik_radar_harian.png'
FULL_IMAGE_PATH = os.path.join(IMAGE_STORAGE_PATH, IMAGE_FILENAME_ONLY)


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
    # Tidak perlu all_required_indices di sini karena kita mengambil '*'

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
            # Mengambil semua kolom dari tabel agar indeks tetap konsisten
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

            # Mengganti nama kolom waktu
            # Cek apakah nama kolom waktu ada di dalam df.columns
            if TIME_COLUMN_NAME_IN_DB in df.columns:
                df.rename(columns={TIME_COLUMN_NAME_IN_DB: 'timestamp'}, inplace=True)
            elif len(df.columns) > 0 and df.columns[0].lower() == 'time': # Penanganan jika nama kolom 'time' huruf kecil
                 df.rename(columns={df.columns[0]: 'timestamp'}, inplace=True)
            else:
                # Fallback jika 'time' tidak ditemukan, coba gunakan kolom pertama (indeks 0)
                # Ini berisiko jika struktur tabel berubah, tetapi lebih baik daripada error
                print(f"Peringatan: Kolom '{TIME_COLUMN_NAME_IN_DB}' tidak ditemukan. Mencoba menggunakan kolom pertama '{df.columns[0]}' sebagai waktu.")
                if len(df.columns) > 0 :
                    df.rename(columns={df.columns[0]: 'timestamp'}, inplace=True)
                else:
                    print(f"Error: Tidak ada kolom yang bisa digunakan sebagai timestamp.")
                    return None
            
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            if df['timestamp'].dt.tz is None:
                df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
            else:
                df['timestamp'] = df['timestamp'].dt.tz_convert('UTC')

            # Ekstrak data parameter berdasarkan indeks kolom yang sudah dikonfigurasi
            # dan beri nama kolom baru yang aman
            df_processed = pd.DataFrame({'timestamp': df['timestamp']}) # Mulai dengan kolom timestamp
            
            actual_column_names = list(df.columns) # Nama kolom aktual dari query

            for param_config in PARAMETERS_CONFIG:
                col_label_safe = param_config['label'].lower().replace(' ', '_').replace('°', '')
                param_db_index = param_config['index']

                if param_db_index < len(actual_column_names):
                    # Mengambil data berdasarkan indeks dari hasil query (df)
                    # bukan dari df_processed yang sedang dibangun
                    df_processed[col_label_safe] = pd.to_numeric(df.iloc[:, param_db_index], errors='coerce')
                else:
                    print(f"Error: Indeks kolom {param_db_index} ({param_config['label']}) di luar jangkauan. Jumlah kolom aktual: {len(actual_column_names)}")
                    df_processed[col_label_safe] = pd.NA 
            
            return df_processed

    except pymysql.Error as e:
        print(f"Error koneksi atau query database: {e}")
        return None
    except Exception as e:
        print(f"Terjadi error saat mengambil data: {e}")
        return None
    finally:
        if conn:
            conn.close()

# VVVVV FUNGSI plot_data DIMODIFIKASI VVVVVV
def plot_data(df, plot_date_str):
    """Membuat dan menyimpan grafik dari data yang diberikan, menandai poin di luar batas."""
    if df is None or df.empty:
        print("Tidak ada data untuk diplot.")
        return False, [] # Mengembalikan status False dan list kosong untuk out-of-range

    num_params = len(PARAMETERS_CONFIG)
    fig, axs = plt.subplots(4, 2, figsize=(18, 22), sharex=True) 
    axs = axs.flatten() 

    fig.suptitle(f"Grafik Parameter Radar Cuaca - {plot_date_str}\nPlus Range Check", fontsize=16, y=0.99)

    out_of_range_summary = [] # Untuk menyimpan info parameter di luar batas

    for i, param_config in enumerate(PARAMETERS_CONFIG):
        ax = axs[i]
        col_label_safe = param_config['label'].lower().replace(' ', '_').replace('°', '')
        
        current_param_label = param_config['label']
        current_param_unit = param_config['unit']
        lower_limit_val, upper_limit_val = param_config['limits']

        if col_label_safe not in df.columns or df[col_label_safe].isnull().all():
            ax.text(0.5, 0.5, 'Data tidak tersedia', horizontalalignment='center', verticalalignment='center', transform=ax.transAxes)
            ax.set_title(f"{current_param_label} ({current_param_unit})")
            ax.set_yticks([]) 
        else:
            # Plot data utama
            ax.plot(df['timestamp'], df[col_label_safe], label=current_param_label, color=param_config['color'], linestyle='-')
            
            # Plot garis batas
            ax.axhline(y=upper_limit_val, color='r', linestyle='--', label=f'Batas Atas ({upper_limit_val})')
            ax.axhline(y=lower_limit_val, color='darkgreen', linestyle='--', label=f'Batas Bawah ({lower_limit_val})')
            
            # Identifikasi dan plot poin di luar batas
            # Pastikan data numerik dan tidak NaN sebelum perbandingan
            valid_data = df[col_label_safe].dropna() 
            
            out_of_bounds_lower = valid_data[valid_data < lower_limit_val]
            out_of_bounds_upper = valid_data[valid_data > upper_limit_val]

            # Gabungkan indeks dari poin di luar batas bawah dan atas
            out_of_bounds_indices = out_of_bounds_lower.index.union(out_of_bounds_upper.index)
            
            num_out_of_bounds = len(out_of_bounds_indices)

            if num_out_of_bounds > 0:
                # Ambil timestamp dan nilai yang sesuai untuk poin di luar batas
                oor_timestamps = df.loc[out_of_bounds_indices, 'timestamp']
                oor_values = df.loc[out_of_bounds_indices, col_label_safe]
                
                ax.scatter(oor_timestamps, oor_values, 
                           color='black', marker='x', s=60, zorder=5, label=f'Di Luar Batas ({num_out_of_bounds} poin)')
                out_of_range_summary.append(f"{current_param_label}: {num_out_of_bounds} poin")

            ax.set_title(f"{current_param_label} ({current_param_unit})")
            ax.set_ylabel(current_param_unit)
            ax.legend(fontsize='small', loc='best') # 'loc' bisa disesuaikan
        
        ax.grid(True)

    # Setting X-axis untuk subplot terakhir yang memiliki data atau subplot terakhir jika semua kosong
    # Kita bisa set untuk semua, tapi jika sharex=True, cukup set di salah satu yang terlihat
    # Cari subplot terakhir yang bukan 'Data tidak tersedia' atau default ke yang paling bawah
    last_ax_with_data_candidate = None
    for i_ax in range(num_params -1, -1, -1): # Iterasi dari belakang
        ax_check = axs[i_ax]
        col_label_check = PARAMETERS_CONFIG[i_ax]['label'].lower().replace(' ', '_').replace('°', '')
        if col_label_check in df.columns and not df[col_label_check].isnull().all():
            last_ax_with_data_candidate = ax_check
            break
    
    if last_ax_with_data_candidate is None and num_params > 0: # Jika semua kosong, gunakan yang terakhir
        last_ax_with_data_candidate = axs[num_params -1]
    
    if last_ax_with_data_candidate:
        last_ax_with_data_candidate.set_xlabel('Waktu (UTC)', fontsize=12)
        utc_formatter = mdates.DateFormatter('%H:%M', tz=pytz.utc) 
        last_ax_with_data_candidate.xaxis.set_major_formatter(utc_formatter)
        last_ax_with_data_candidate.xaxis.set_major_locator(mdates.HourLocator(interval=2)) 
    
    fig.autofmt_xdate(rotation=45) 
    plt.tight_layout(rect=[0, 0, 1, 0.97]) 

    try:
        if not os.path.exists(IMAGE_STORAGE_PATH):
            os.makedirs(IMAGE_STORAGE_PATH)
            print(f"Direktori {IMAGE_STORAGE_PATH} dibuat.")
        plt.savefig(FULL_IMAGE_PATH)
        print(f"Grafik berhasil disimpan sebagai {FULL_IMAGE_PATH}")
        return True, out_of_range_summary
    except Exception as e:
        print(f"Gagal menyimpan grafik: {e}")
        return False, []
# ^^^^^ FUNGSI plot_data DIMODIFIKASI ^^^^^
# Fungsi kirim pesan ke Telegram
def send_telegram(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message
    }
    requests.post(url, json=payload)

def send_telegram_photo(image_path, caption=""):
    """Mengirim foto ke Telegram."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
    try:
        with open(image_path, 'rb') as photo_file:
            files = {'photo': photo_file}
            data = {'chat_id': TELEGRAM_CHAT_ID, 'caption': caption}
            # Tambahkan timeout untuk request
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
                # plot_data sekarang mengembalikan status dan summary
                plot_success, out_of_range_details = plot_data(radar_df, plot_date_str) 
                
                if plot_success:
                    telegram_caption = f"Range Check Parameter Radar Cuaca\nTanggal: {plot_date_str} "
                    if out_of_range_details:
                        telegram_caption += "\n\nPoin di luar batas normal:"
                        for detail in out_of_range_details:
                            telegram_caption += f"\n- {detail}"
                    else:
                        telegram_caption += "\n\nSemua parameter dalam batas normal."
                        
                    send_telegram_photo(FULL_IMAGE_PATH, caption='')
                    send_telegram(telegram_caption)
                else:
                    # Gagal plot, mungkin kirim pesan error
                    error_message = f"Gagal membuat grafik untuk tanggal {plot_date_str} (UTC)."
                    url_text = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
                    payload_text = {'chat_id': TELEGRAM_CHAT_ID, 'text': error_message}
                    try:
                        requests.post(url_text, data=payload_text, timeout=10)
                        print("Pesan 'gagal plot' dikirim ke Telegram.")
                    except Exception as e_tg_text:
                        print(f"Gagal mengirim pesan teks 'gagal plot' ke Telegram: {e_tg_text}")

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
        # Tidak perlu menghapus file jika path-nya tetap dan akan ditimpa
        # if os.path.exists(FULL_IMAGE_PATH):
        #     os.remove(FULL_IMAGE_PATH)
        #     print(f"File gambar {FULL_IMAGE_PATH} telah dihapus.")
        pass

    print("Skrip selesai.")
# --- END OF MODIFIED simonbite_grafiks.py ---