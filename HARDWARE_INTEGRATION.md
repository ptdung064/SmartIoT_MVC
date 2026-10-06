# Hardware integration check

Code ESP32 `main.cpp` hiện tại tương thích với Backend trong project này.

## Topics
- Sensor: `home/sensors/data`
- Control: `home/devices/control`
- Status: `home/devices/status`

## Mapping
- `led_1` -> GPIO 18
- `led_2` -> GPIO 19
- `led_3` -> GPIO 21
- DHT22 -> GPIO 4
- LDR -> GPIO 34

## Cấu hình Backend
Backend hỗ trợ `MQTT_BROKER`, `MQTT_USERNAME`, `MQTT_PASSWORD` trong `.env`.

Nếu đổi mạng/hotspot làm IP laptop thay đổi, cập nhật cả IP broker trong ESP32 và `.env`.
