## simpan hasil di log json
import mysql.connector
import requests
import json
import os
from datetime import datetime, timedelta
import pytz
import pandas as pd
import matplotlib.pyplot as plt

 # Dapatkan waktu saat ini dalam UTC
now = datetime.now(pytz.utc)
# Format waktu sesuai kebutuhan
time = now.strftime("%d-%m-%Y at %H:%M:%S UTC")
token = '694548757:AAFhtqcduAUH5v0vk0zCQzZkgxrdIXAuGk4' #Token Simongen
# token = '686390641:AAHCH-IQDig7GOFGMTphHpiPCoh5R1O6y38' #token Simonrad
chat_id = '-1002449239635'##'-220125481' # chat simonjar
# token = '629138334:AAHu9FaOVzJaiuUfMz0zHyAEGfDMIJBR1oA' # Token simontes
# chat_id = '79888740

def send_telegram_photo(photo_path):
    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    with open(photo_path, 'rb') as photo:
        files = {'photo': photo}
        data = {'chat_id': chat_id}
        response = requests.post(url, files=files, data=data)
        if response.status_code != 200:
            print(f"Failed to send photo. Status code: {response.status_code}, Response: {response.text}")
        else:
            print("Photo sent successfully.")


# Fungsi untuk mengirim pesan ke Telegram
def send_telegram_message(message):
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': message
    }
    requests.post(url, data=payload)

# Fungsi untuk memeriksa kondisi
def check_conditions(latest_data, previous_data):
    notifications = []

    # Kondisi 1: nilai kolom 2, 3, dan 4 sama dengan 0
    for col in [1, 2, 3]:  # Kolom 2, 3, dan 4 (index 1, 2, 3)
        if latest_data[col] == "0" and previous_data[col] != "0":
           notifications.append(f'SimonGen Report {time}:\n[PLN OFF..!! ❌]\nPhase R: {latest_data[1]} V\nPhase S: {latest_data[2]} V\nPhase T: {latest_data[3]} V\n-send by python-')
        elif latest_data[col] != "0" and previous_data[col] == "0":
            notifications.append(f'SimonGen Report {time}:\n[PLN ON :) ✅]\nPhase R: {latest_data[1]} V\nPhase S: {latest_data[2]} V\nPhase T: {latest_data[3]} V\n-send by python-')   

    # Kondisi 2: nilai kolom 5 dan 6 < 10
    for col in [4, 5]:  # Kolom 5 dan 6 (index 4, 5)
        if latest_data[col] < 10 and previous_data[col] >= 10:
            notifications.append(f'SimonGen Report {time}:\n[WARNING LOW FUEL..!! ❌]\nBackup Fuel: {latest_data[4]} ltr\nMain Fuel: {latest_result[5]} ltr\n-send by python-')
        elif latest_data[col] >= 10 and previous_data[col] < 10:
            notifications.append(f'SimonGen Report {time}:\n[FULL FUEL :) ✅]\nBackup Fuel: {latest_data[4]} ltr\nMain Fuel: {latest_result[5]} ltr\n-send by python-')

    # Kondisi 3: nilai kolom 7 dan 8 tidak sama dengan 0
    for col in [6, 7]:  # Kolom 7 dan 8 (index 6, 7)
        if latest_data[col] == 1 and previous_data[col] == 0:
           notifications.append(f'SimonGen Report {time}:\n[Genset & Fuel Pump status]\nGenset Status: {latest_result[7]}\nFuel Pump status: {latest_result[6]}\n\nBackup Fuel: {latest_data[4]} ltr\nMain Fuel: {latest_result[5]} ltr\n\n** 0 = OFF; 1 = ON\n-send by python-')
        elif latest_data[col] == 0 and previous_data[col] == 1:
            notifications.append(f'SimonGen Report {time}:\n[Genset & Fuel Pump status]\nGenset Status: {latest_result[7]}\nFuel Pump status: {latest_result[6]}\n\nBackup Fuel: {latest_data[4]} ltr\nMain Fuel: {latest_result[5]} ltr\n\n** 0 = OFF; 1 = ON\n-send by python-')
        
    return notifications

# Fungsi untuk mengubah datetime menjadi string
def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError("Type not serializable")

# Fungsi untuk mengubah string menjadi datetime
def deserialize_datetime(data):
    for i, item in enumerate(data):
        if isinstance(item, str):
            try:
                data[i] = datetime.strptime(item, '%Y-%m-%dT%H:%M:%S')
            except ValueError:
                continue
    return data

# Path untuk log file
# log_file_path = 'latest_result_log.json'
log_file_path = '/home/opmet/PYTHON/latest_result_log.json'

try:
    # Menghubungkan ke database
    conn = mysql.connector.connect(
        host="192.168.11.201",  # Ganti dengan alamat IP atau 'localhost'
        user="teknisi",           # Ganti dengan username MySQL Anda
        password="t3kn1s1!",       # Ganti dengan password MySQL Anda
        database="radmon"   # Ganti dengan nama database Anda
    )

    # Membuat cursor
    cursor = conn.cursor()

    # Menjalankan query SQL untuk mengambil data terbaru
    query = "SELECT * FROM simongen ORDER BY datetime DESC LIMIT 1"  # Ganti 'timestamp_column' dengan nama kolom timestamp
    cursor.execute(query)

    # Mengambil satu baris hasil query
    latest_result = cursor.fetchone()

    if latest_result:
        latest_data = list(latest_result)

        # Membaca log file untuk mendapatkan data sebelumnya
        if os.path.exists(log_file_path):
            try:
                with open(log_file_path, 'r') as log_file:
                    previous_data = json.load(log_file)
                    previous_data = deserialize_datetime(previous_data)
            except (json.JSONDecodeError, ValueError):
                previous_data = [None] * len(latest_data)
        else:
            previous_data = [None] * len(latest_data)

        # Memeriksa kondisi dan mendapatkan notifikasi jika ada perubahan
        notifications = check_conditions(latest_data, previous_data)

        # Mengirim notifikasi ke Telegram jika ada perubahan kondisi
        for notification in notifications:
            output=notification
            # send_telegram_message(notification)
            # print(notification)
        if notifications:
            send_telegram_message(output)

        # Menyimpan hasil terbaru ke dalam log file
        latest_data_serializable = [serialize_datetime(item) if isinstance(item, datetime) else item for item in latest_data]
        with open(log_file_path, 'w') as log_file:
            json.dump(latest_data_serializable, log_file)
    else:
        print("Tidak ada data yang ditemukan.")

except mysql.connector.Error as err:
    print(f"Error: {err}")
    send_telegram_message(err)

finally:
    # Menutup cursor dan koneksi
    if cursor:
        cursor.close()
    if conn:
        conn.close()


###########################################################
### Generate Grafik
        
# Connect to the MySQL database
def fetch_data():
    conn = mysql.connector.connect(
        host="192.168.11.201",  # Ganti dengan alamat IP atau 'localhost'
        user="teknisi",           # Ganti dengan username MySQL Anda
        password="t3kn1s1!",       # Ganti dengan password MySQL Anda
        database="radmon"   # Ganti dengan nama database Anda
    )
    query = """
        SELECT datetime, vr, vs, vt, arus_r, arus_s, arus_t, temperature, humidity
        FROM simonrad
        WHERE datetime >= NOW() - INTERVAL 24 HOUR
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Convert to UTC time
def convert_to_utc(df):
    df['datetime'] = pd.to_datetime(df['datetime'], errors='coerce')  # Use 'errors' parameter to handle invalid parsing
    df = df.set_index('datetime')
    df.index = df.index.tz_localize('UTC')
    return df

# Resample the data to 10-minute averages
def resample_data(df):
    # Convert string columns to numeric, coercing errors
    numeric_columns = ['vr', 'vs', 'vt', 'arus_r', 'arus_s', 'arus_t', 'temperature', 'humidity']
    
    # Loop through each column and handle different data types
    for col in numeric_columns:
        if df[col].dtype == 'object':  # Only process if column type is object (string)
            df[col] = pd.to_numeric(df[col].str.replace('[^0-9.-]', '', regex=True), errors='coerce')  # Clean and convert
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce')  # Convert to numeric if already numeric type

    return df.resample('10T').mean()


# Function to send photo to Telegram
# def send_telegram_photo(photo_path):
#     url = f"https://api.telegram.org/bot{token}/sendPhoto"
#     with open(photo_path, 'rb') as photo:
#         files = {'photo': photo}
#         data = {'chat_id': chat_id}
#         response = requests.post(url, files=files, data=data)
#         if response.status_code != 200:
#             print(f"Failed to send photo. Status code: {response.status_code}, Response: {response.text}")
#         else:
#             print(f"Photo sent successfully: {photo_path}")

# Plot the first graph (Voltage)
def plot_voltage(df):
    plt.figure(figsize=(10, 5))
    plt.plot(df.index, df['vr'], label='Phase R (V)', color='r')
    plt.plot(df.index, df['vs'], label='Phase S (V)', color='g')
    plt.plot(df.index, df['vt'], label='Phase T (V)', color='b')
    plt.ylim(0, 300)
    plt.title('Load Voltage Levels (10-minute average)')
    plt.xlabel('Time')
    plt.ylabel('Voltage (V)')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('/home/opmet/PYTHON/voltage_graph.png')
    plt.show()
    send_telegram_photo('/home/opmet/PYTHON/voltage_graph.png')  # Send the voltage graph

# Plot the second graph (Current)
def plot_current(df):
    plt.figure(figsize=(10, 5))
    plt.plot(df.index, df['arus_r'], label='Current R (A)', color='r')
    plt.plot(df.index, df['arus_s'], label='Current S (A)', color='g')
    plt.plot(df.index, df['arus_t'], label='Current T (A)', color='b')
    plt.ylim(0, 25)
    plt.title('Load Current Levels (10-minute average)')
    plt.xlabel('Time')
    plt.ylabel('Current (A)')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('/home/opmet/PYTHON/current_graph.png')
    plt.show()
    send_telegram_photo('/home/opmet/PYTHON/current_graph.png')  # Send the current graph

# Plot the third graph (Temperature and Humidity)
def plot_temp_humidity(df):
    plt.figure(figsize=(10, 5))
    plt.plot(df.index, df['temperature'], label='Temperature (°C)', color='orange')
    plt.plot(df.index, df['humidity'], label='Humidity (%)', color='blue')
    plt.ylim(0, 100)
    plt.title('Server Room Temperature and Humidity (10-minute average)')
    plt.xlabel('Time')
    plt.ylabel('Value')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('/home/opmet/PYTHON/temp_humidity_graph.png')
    plt.show()
    send_telegram_photo('/home/opmet/PYTHON/temp_humidity_graph.png')  # Send the temperature and humidity graph

# Main function to fetch, process, and plot data
def main():
    df = fetch_data()
    df = convert_to_utc(df)
    df_resampled = resample_data(df)
    
    # Plot graphs and send them via Telegram
    plot_voltage(df_resampled)
    plot_current(df_resampled)
    plot_temp_humidity(df_resampled)


if now.hour==1 and now.minute==5 :
    dailystat = f'Daily SimonGen Report {time}:\nPLN Voltage (R) = {latest_data[1]}V\nPLN Voltage (S) = {latest_data[2]}V\nPLN Voltage (T) = {latest_data[3]}V\nGenset Fuel = {latest_data[5]} lt\nBackup Fuel = {latest_data[4]} lt\n\n-send by python'
    send_telegram_message(dailystat)

    try:
    # Menghubungkan ke database
        conn = mysql.connector.connect(
            host="192.168.11.201",  # Ganti dengan alamat IP atau 'localhost'
            user="teknisi",           # Ganti dengan username MySQL Anda
            password="t3kn1s1!",       # Ganti dengan password MySQL Anda
            database="radmon"   # Ganti dengan nama database Anda
        )

    # Membuat cursor
        cursor = conn.cursor()

    # Menentukan rentang waktu
        end_time = datetime.now()
        start_time = end_time - timedelta(days=1)

    # Menjalankan query SQL untuk mengambil data dalam rentang satu hari dengan rata-rata setiap 10 menit
        query = f"""
        SELECT 
            datetime,
            AVG(vr) AS avg_col1,
            AVG(vs) AS avg_col2,
            AVG(vt) AS avg_col3
        FROM simongen
        WHERE datetime BETWEEN '{start_time}' AND '{end_time}'
        GROUP BY UNIX_TIMESTAMP(datetime) DIV 600
        ORDER BY datetime
        """
        cursor.execute(query)

    # Mengambil hasil query ke dalam DataFrame
        data = cursor.fetchall()
        df = pd.DataFrame(data, columns=['timestamp', 'avg_col1', 'avg_col2', 'avg_col3'])

    # Menutup cursor dan koneksi
        cursor.close()
        conn.close()

    # Membuat grafik garis
        plt.figure(figsize=(10, 5))
        plt.plot(df['timestamp'], df['avg_col1'], label='PLN Phase R', marker='o')
        plt.plot(df['timestamp'], df['avg_col2'], label='PLN Phase S', marker='o')
        plt.plot(df['timestamp'], df['avg_col3'], label='PLN Phase T', marker='o')
        plt.xlabel('Timestamp')
        plt.ylabel('Voltage')
        plt.ylim(0, 300)
        plt.title('Daily PLN Graph (10 min average)')
        plt.legend()
        plt.xticks(rotation=45)
        plt.tight_layout()

    # Menyimpan grafik sebagai gambar
        # graph_path = 'graph.png'
        graph_path = '/home/opmet/PYTHON/graph.png'

        plt.savefig(graph_path)
        plt.close()

    # Mengirim gambar grafik ke Telegram
        send_telegram_photo(graph_path)

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        send_telegram_message(err)

    except Exception as e:
        print(f"Unexpected error: {e}")
        send_telegram_message(e)

    if __name__ == '__main__':
        main()
