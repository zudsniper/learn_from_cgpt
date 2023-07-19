// new_scraper_2.js
// v0.3.6
// ---------------
//
// by @zudsniper & chatGPT4 w/ Plugins [Metaphor Search, Link Reader, Chat Stack Exchange]

const ucd = require('undetected-chromedriver').default;
const log = require('loglevel');
const chalk = require('chalk');
const readline = require('readline');
const moment = require('moment');

// Constants
const SCROLLER_SELECTOR = ".sport-area__grow__scrollable--5vYw3D";
const EVENT_SELECTOR = ".sport-base-event--pDx9cf._compact--5fB1ok";
const EVENT_NAME_SELECTOR = ".sport-event__name--HefZLq";
const ODDS_SELECTOR = ".table-component-factor-value_single--6nfox5";
const URL = "https://www.fon.bet/sports/football/?mode=1";

// Configure loglevel
log.setLevel('debug');
const originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);

  return function (message) {
    const timestamp = moment().format('HH:mm:ss');
    const level = {
      TRACE: chalk.cyan('TRACE'),
      DEBUG: chalk.gray('DEBUG'),
      INFO: chalk.white('INFO'),
      WARN: chalk.yellow('WARN'),
      ERROR: chalk.red('ERROR'),
      SILENT: chalk.magenta('SILENT')
    }[methodName.toUpperCase()];
    rawMethod(`${chalk.green(timestamp)} [${level}] ${message}`);
  };
};
log.setDefaultLevel('info');

let isRunning = true;
let eventCount = 0;
const startTime = Date.now();

// Listen for "q" keypress
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.name === 'q') {
    isRunning = false;
  }
});

/**
 * Main function to run the scraping process.
 */
async function runScraping() {
    log.info('Starting the browser...');
    const browser = await ucd.launch({ headless: false });
    const page = await browser.newPage();
    log.info('Navigating to the page...');
    await page.goto(URL);

    await page.waitForSelector(SCROLLER_SELECTOR);

    let eventList = [];

    while (isRunning) {
        log.debug('Scrolling until data is loaded...');
        await scrollUntilDataLoaded(page, SCROLLER_SELECTOR);
        log.debug('Scraping data...');
        const newData = await scrapeData(page, EVENT_SELECTOR, EVENT_NAME_SELECTOR, ODDS_SELECTOR);
        eventList = eventList.concat(newData);
        eventCount += newData.length;

        log.debug('Scraping last element data...');
        const lastElementData = await scrapeLastElementData(page, EVENT_SELECTOR, EVENT_NAME_SELECTOR, ODDS_SELECTOR);
        if (!lastElementData) break;

        eventList.push(lastElementData);
        eventCount++;
        await page.waitForTimeout(500);
    }

    log.info(chalk.green('Scraped data:'), eventList);
    log.info('Closing the browser...');
    await browser.close();

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    log.info(`Execution time: ${executionTime} seconds`);
    log.info(`Number of events scraped: ${eventCount}`);
}

runScraping();
