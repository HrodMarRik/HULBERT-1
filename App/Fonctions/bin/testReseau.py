import logging
import subprocess
import socket
import requests
import json
import os
import sys

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig

def ping_test():
    hostname = "8.8.8.8"
    result = subprocess.run(['ping', '-c', '1', hostname], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return result.returncode == 0

def http_test():
    try:
        response = requests.get("https://www.google.com", timeout=5)
        return response.status_code == 200
    except requests.RequestException as e:
        logging.error(f"HTTP test error: {e}")
        return False

def socket_test(host, port):
    try:
        with socket.create_connection((host, port), timeout=5) as sock:
            return True
    except socket.error as e:
        logging.error(f"Socket test error: {e}")
        return False

def speed_test():
    try:
        process = subprocess.Popen(['speedtest', '--json'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            logging.error(f"Speedtest command returned non-zero exit code: {process.returncode}")
            return None

        # Analyser la sortie JSON
        speedtest_results = json.loads(stdout)

        return speedtest_results

    except Exception as e:
        logging.error(f"Error running speedtest: {e}")
        return None

def main():
    logging.debug("DEBUT Test Réseau")
    network_info = {
        "Ping Test": "Success" if ping_test() else "Failed",
        "HTTP Test": "Success" if http_test() else "Failed",
        "Socket Test 8.8.8.8:443": "Success" if socket_test("8.8.8.8", 443) else "Failed",
        "Socket Test 1.1.1.1:80": "Success" if socket_test("1.1.1.1", 80) else "Failed"
    }

    speedtest_results = speed_test()
    if speedtest_results:
        download_speed = speedtest_results["download"]["bandwidth"] / 1_000_000  # Convert to Mbps
        upload_speed = speedtest_results["upload"]["bandwidth"] / 1_000_000  # Convert to Mbps
        ping = speedtest_results["ping"]["latency"]

        network_info["Speed Test"] = {
            "Download Speed (Mbps)": f"{download_speed:.2f}",
            "Upload Speed (Mbps)": f"{upload_speed:.2f}",
            "Ping (ms)": ping
        }
    else:
        network_info["Speed Test"] = "Failed"

    logging.debug(" FIN Test Reseau")

    json_output = json.dumps(network_info, indent=4)

    return json_output

if __name__ == "__main__":
    main()
