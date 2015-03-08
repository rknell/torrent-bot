// Load Dependencies
// -----------------
engine = require('./engine/engine');
var torrentEngine = require('./services/main');

// Configure the engine
// --------------------
engine.config = {
  port: process.env.port || 3000,
  dbUri: process.env.DB_URI || "mongodb://localhost/torrent-bot",
  apiPrefix: "/api"
};

if(!process.env.DEVELOPMENT){
  engine.config.port = 80;
}

/**
 * Setup the static views
 * ----------------------
 * Remove the default one below to just use static HTML
 * in the www/public directory
 */
//engine.express.app.get('/', function (req, res) {
//  res.render('index', {title: "Title"})
//});

/**
 * Initialise
 * ----------
 * Initialise the app and mount the models and routes
 */
engine.init();
