Install Instructions:

All Systems:

Install MongoDB
Install NodeJS
Install GIT

Windows 8:
Install Express 2013 for Windows Desktop
http://go.microsoft.com/?linkid=9832280

Git clone:
In a command prompt enter:

c:
git clone https://bitbucket.org/rknell/torrent-bot
cd torrent-bot
npm install

Then to run the server enter:
node app.js

Open up your browser and enter:
http://localhost:3000

If you want to create a batch file that will update the program each time and then run it you can create something like this:

c:
cd torrent-bot
git pull
npm install
node app.js

