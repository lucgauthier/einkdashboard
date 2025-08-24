# Family Dashboard

Code for family dashboard. Always-on 10 inch e-ink screen, updated daily.

![Photo](image.jpg)

## Requirements

- Inkplate 10
- Docker server, network accessible from Inkplate device
- PirateWeather API key

## Useful Links

- [Pirate Weather Doc](http://docs.pirateweather.net/en/latest/)
- [Inkplate](https://inkplate.readthedocs.io/en/latest/)
- [Inkplate Arduino Setup](https://github.com/SolderedElectronics/Inkplate-Arduino-library#setting-up-inkplate-in-arduino-ide)
- [Inkplate 10 examples](https://github.com/SolderedElectronics/Inkplate-Arduino-library/tree/master/examples/Inkplate10)
- [node-html-to-image](https://github.com/frinyvonnick/node-html-to-image)

## Components

### Client: Inkplate 10 device

- This component fetch the current dashboard from the server and displays the info as-is on e-ink display.
- The device use wifi to access the home network.
- Client code is in client/ folder.
- Arduino C code. Use Arduino IDE to build and deploy to device.

### Dashboard server

- Generate the dashboard image on a schedule. Serve this image to the client device when requested.
- Server code is in server/ folder.
- It is a basic node.js application.
- The weather is fetched from the pirateweather api. See server/accessors/pirateweather.js
- The events data is fetched from an iCal url. See server/accessors/ical.js
- The dashboard image is generated using an html template. See server/accessors/template

## Development

### Client

Arduino IDE.

Dependencies:

- Inkplate arduino libraries.
- Inkplate board definition.

### Server

Environment variables:

```
PIRATEWEATHER_APIKEY=***
WEATHER_CACHE_DURATION_MINUTES=120
PORT=8080
```

Put those values in .ENV file to configure your server.

Then, we can manager more than one dashboard generation. Each dashboard has it's on folder in /data/dashboards/. Name the folder the way you want, than add 1- an empty output folder for the generated dashboard, and 2- a `settings.json` file like this:

```json
{
    "description": "internal description here. not displayed anywhere",
    "token": "xyz", // token is sent by client. Allow the client to fetch the appropriate dashboard.
    "cron": "0 45 0-7,21-23 * * *", // when to generate dashboard
    "timezone": "America/Toronto", // used by the cron scheduler
    "eink_sleep_until": 7, // put 7 so the eink display will sleep until 7 am
    "nextday_cutoff": 8, // put 8 so any generation after 8:59 will generate the next day
    "ical_url": "https://p35-caldav.icloud.com/published/2/...redacted...", // ical url where to fetch all day events to display on dashboard
    "lat": 46.85, // weather forecast location
    "lon": -71.38, // weather forecast location
    "weather_am": 8, // dashboard display 2 temps for the day, first hour to display here. Put 8 for 8 am
    "weather_pm": 14 // dashboard display 2 temps for the day, second hour to display here. Put 14 for 2 pm
}
```

```bash
cd server
npm install
node .
```

Now, you can make changes to the template and see the result in a browser at [http://localhost:8080/generatePage](http://localhost:8080/generatePage).

I used NSSM to host the node app as a windows service on my home server box. Now I use Docker to run the service on a Ubuntu VM.

#### Running server with Docker

From the project root, build the Docker image with:

```powershell
docker build -t your-image-name ./server
```

Replace `your-image-name` with a name you choose for your image.

To run the server in Docker with proper environment variables (since `.env` is not included in the image) and map a local folder to the container's output directory, use the following command (replace the local path as needed):

```powershell
docker run \
	-v "C:\my\local\dashboardServer:/usr/src/app/data" \
	-p 8080:8080 \
	-e PIRATEWEATHER_APIKEY=your_api_key \
	--restart=always \
	your-image-name
```

Replace the values as needed for your environment.

This will map your local `C:\my\local\output` folder to the container's `/usr/src/app/output` directory, allowing you to access generated files on your host machine for easier troubleshooting or archiving needs.

## Troubleshooting

### Arduino IDE

``` 
Compilation error: Error resolving FQBN: getting build properties for board Inkplate_Boards:esp32:Inkplate10: invalid option 'PSRAM'

Compilation error: Error resolving FQBN: getting build properties for board Inkplate_Boards:esp32:Inkplate10: invalid option 'CPUFreq'
```

1. Delete inkplate library
2. Delete inkplate board
3. Install inkplate board
4. Compile. Missing file error should happear.
5. Install inkplate library
6. Compile... it should work now.
