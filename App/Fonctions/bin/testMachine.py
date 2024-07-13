import platform
import psutil
import logging
import json
import os
import sys

parent_dir = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
sys.path.insert(0, parent_dir)

import App.Fonctions.bin.loggerConfig

def get_os_info():
    return {
        "System": platform.system(),
        "Node": platform.node(),
        "Release": platform.release(),
        "Version": platform.version(),
        "Machine": platform.machine(),
        "Processor": platform.processor()
    }

def get_battery_info():
    battery = psutil.sensors_battery()
    if battery:
        return {
            "Percentage": [f"{battery.percent:.2f}", "%"],
            "Plugged In": battery.power_plugged,
            "Time Left": f"{battery.secsleft // 3600}h {battery.secsleft % 3600 // 60}m" if battery.secsleft != -2 else "N/A"
        }
    else:
        return "No battery information available"

def get_machine_capabilities():
    return {
        "CPU Count": psutil.cpu_count(logical=True),
        "CPU Frequency": {
            "Current": [f"{psutil.cpu_freq().current:.2f}", "Mhz"],
            "Min": [f"{psutil.cpu_freq().min:.2f}", "Mhz"],
            "Max": [f"{psutil.cpu_freq().max:.2f}", "Mhz"]
        },
        "Total Memory": [f"{psutil.virtual_memory().total / 1_073_741_824:.2f}", "GB"],
        "Available Memory": [f"{psutil.virtual_memory().available / 1_073_741_824:.2f}", "GB"],
        "Used Memory": [f"{psutil.virtual_memory().used / 1_073_741_824:.2f}", "GB"],
        "Memory Usage": [f"{psutil.virtual_memory().percent:.2f}", "%"],
        "Disk Usage": {
            "Total": [f"{psutil.disk_usage('/').total / 1_073_741_824:.2f}", "GB"],
            "Used": [f"{psutil.disk_usage('/').used / 1_073_741_824:.2f}", "GB"],
            "Free": [f"{psutil.disk_usage('/').free / 1_073_741_824:.2f}", "GB"],
            "Usage": [f"{psutil.disk_usage('/').percent:.2f}", "%"]
        }
    }

def main():
    logging.debug("DEBUT Test Système")

    system_info = {
        "OS Info": get_os_info(),
        "Battery Info": get_battery_info(),
        "Machine Capabilities": get_machine_capabilities()
    }
    
    json_output = json.dumps(system_info, indent=4)
    
    logging.debug("FIN Test Système")

    return json_output

if __name__ == "__main__":
    main()
