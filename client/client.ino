#ifndef ARDUINO_INKPLATE10
#error "Wrong board selection for this example, please select Inkplate 10 in the boards menu."
#endif

#include "HTTPClient.h"
#include "Inkplate.h"
#include "WiFi.h"

// wifi AP client setup
const char ssid[] = "***";
const char* password = "***";

// image download url
const String imageUrl = "http://10.0.1.128:8080/image.bmp";
const String sleepTimeUrl = "http://10.0.1.128:8080/device";

// Create object on Inkplate library and set library to work in gray mode (3-bit)
Inkplate display(INKPLATE_3BIT);

// Conversion factor for seconds to micro seconds
#define uS_TO_S_FACTOR 1000000

HTTPClient httpClient;

void setup() {
  bool wifiIsConnected;
  bool imageIsDisplayed;
  uint64_t sleepSeconds;

  setupDisplay();
  setupLogger();

  wifiIsConnected = connectWifi();

  if (!wifiIsConnected) {
    // AP was unavailable with this SSIS and password. Retry in one hour.
    deepSleep(60 * 60);
    // program exits on deepSleep
  }

  setupHttpClient();

  imageIsDisplayed = downloadAndDisplayImage(imageUrl);

  if (!imageIsDisplayed) {
    log("Failure to download/display image, retry attempt in 60 seconds");
    sleepSeconds = 60;
  } else {
    sleepSeconds = getSleepTimeInSeconds(sleepTimeUrl);
  }

  disconnectWifi();

  deepSleep(sleepSeconds);
}

void loop() {
  // nothing to do.
}

void deepSleep(uint64_t sleepSeconds) {
  // Activate wake-up timer
  esp_sleep_enable_timer_wakeup(sleepSeconds * uS_TO_S_FACTOR);

  // Enable wakup from deep sleep on gpio 39 where RTC interrupt is connected
  // PS: it doesn't seem to work with current hardware setup
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_39, 0);

  // Put ESP32 into deep sleep. Program stops here but still need a little power.
  // When it wakes up, setup() is called. Memory is wiped.
  log("Put ESP32 into deep sleep. Program stops here but still need a little power.");
  esp_deep_sleep_start();
}

void setupDisplay() {
  // Init library (you should call this function ONLY ONCE)
  display.begin();

  // Clear display
  display.clearDisplay();
  display.display();
}

void setupLogger() {
  // Initialize the serial communication
  Serial.begin(115200);
}

void log(String message) {
  Serial.println(message);
}

bool downloadAndDisplayImage(String url) {
  log("downloadAndDisplayImage start");

  bool success = false;

  httpClient.begin(url);

  // Check response code.
  int httpCode = httpClient.GET();
  if (httpCode == 200) {
    // Get the response length and make sure it is not 0.
    int32_t len = httpClient.getSize();
    if (len > 0) {
      // Clear frame buffer of display
      display.clearDisplay();

      if (display.drawBitmapFromWeb(httpClient.getStreamPtr(), 0, 0, len)) {
        display.display();

        log("display.drawBitmapFromWeb success");
        success = true;
      } else {
        // If something failed (wrong filename or wrong bitmap format), write error message on the screen.
        // Only use Windows Bitmap file with color depth of 1, 4, 8 or 24 bits with no compression!
        log("display.drawBitmapFromWeb failure");
      }
    } else {
      log("Invalid response length");
    }
  } else {
    log("HTTP error");
  }

  httpClient.end();

  return success;
}

uint64_t getSleepTimeInSeconds(String url) {
  log("getSleepTimeInSeconds start");

  uint64_t seconds = 15;

  httpClient.begin(url);

  // Check response code.
  int httpCode = httpClient.GET();
  if (httpCode == 200) {
    // Get the response length and make sure it is not 0.
    int32_t len = httpClient.getSize();
    if (len > 0) {
      String payload = httpClient.getString();

      log("received payload " + payload);

      seconds = payload.toInt();

    } else {
      log("sleep: Invalid response length");
    }
  } else {
    log("sleep: HTTP error");
  }

  httpClient.end();

  return seconds;
}

bool connectWifi() {
  log("Connecting to WiFi...");

  // Connect to the WiFi network.
  // todo: after too many failed attempt, retry in 1 hour...
  WiFi.mode(WIFI_MODE_STA);
  WiFi.begin(ssid, password);

  int timerMs = 0;
  int timeoutMs = 60000;
  int delayMs = 500;

  while (WiFi.status() != WL_CONNECTED) {
    if (timerMs >= timeoutMs) {
      log("WiFi timeout, could not connect.");
      return false;
    }

    delay(delayMs);
    log(".");
    timerMs += delayMs;
  }

  log("WiFi OK!");

  return true;
}

void disconnectWifi() {
  WiFi.mode(WIFI_OFF);
}

void setupHttpClient() {
  // Set parameters to speed up the download process.
  httpClient.getStream().setNoDelay(true);
  httpClient.getStream().setTimeout(1);
}
