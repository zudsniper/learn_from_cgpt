// new_scraper_1.js
// v0.2.6
// ---------------
//
// by @zudsniper & chatGPT4 w/ Plugins [Metaphor Search, Link Reader, Chat Stack Exchange]

const ucd = require('undetected-chromedriver').default;
const log = require('loglevel');
const chalk = require('chalk');

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
    rawMethod(`[${new Date().toISOString()}] ${chalk.green(loggerName)} ${message}`);
  };
};
log.setDefaultLevel('info');

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

    while (true) {
        log.debug('Scrolling until data is loaded...');
        await scrollUntilDataLoaded(page, SCROLLER_SELECTOR);
        log.debug('Scraping data...');
        const newData = await scrapeData(page, EVENT_SELECTOR, EVENT_NAME_SELECTOR, ODDS_SELECTOR);
        eventList = eventList.concat(newData);

        log.debug('Scraping last element data...');
        const lastElementData = await scrapeLastElementData(page, EVENT_SELECTOR, EVENT_NAME_SELECTOR, ODDS_SELECTOR);
        if (!lastElementData) break;

        eventList.push(lastElementData);
        await page.waitForTimeout(500);
    }

    log.info('Scraped data:', eventList);
    log.info('Closing the browser...');
    await browser.close();
}

/**
 * Scrolls the page until no new data is loaded.
 * @param {Object} page - The puppeteer page object.
 * @param {string} scrollerSelector - The CSS selector for the scrollable element.
 */
async function scrollUntilDataLoaded(page, scrollerSelector) {
    const distance = 50;
    const delay = 200;
    const maxRetries = 3;
    let retries = 0;
    let previousHeight = await page.$eval(scrollerSelector, scroller => scroller.scrollHeight);

    while (retries < maxRetries) {
        log.debug('Scrolling the page...');
        await page.evaluate((selector, scrollDistance) => {
            const scroller = document.querySelector(selector);
            scroller.scrollBy(0, scrollDistance);
        }, scrollerSelector, distance);

        await page.waitForTimeout(delay);

        const newHeight = await page.$eval(scrollerSelector, scroller => scroller.scrollHeight);
        if (newHeight === previousHeight) retries++;
        else retries = 0;

        previousHeight = newHeight;
        if (retries === maxRetries) break;
    }

    await page.waitForTimeout(500);
}

/**
 * Scrapes data from the page.
 * @param {Object} page - The puppeteer page object.
 * @param {string} eventSelector - The CSS selector for the event elements.
 * @param {string} eventNameSelector - The CSS selector for the event name elements.
 * @param {string} oddsSelector - The CSS selector for the odds elements.
 * @returns {Array} An array of event data.
 */
async function scrapeData(page, eventSelector, eventNameSelector, oddsSelector) {
    return await page.$$eval(eventSelector, (elements, eventNameSelector, oddsSelector) =>
        elements.map(element => {
            const eventNameElement = element.querySelector(eventNameSelector);
            const eventName = eventNameElement ? eventNameElement.textContent.trim() : "";

            const oddsElements = element.querySelectorAll(oddsSelector);
            const odds = Array.from(oddsElements).map(oddsElement => oddsElement.textContent.trim());

            return { eventName, odds };
        }), eventNameSelector, oddsSelector);
}

/**
 * Scrapes data from the last element on the page.
 * @param {Object} page - The puppeteer page object.
 * @param {string} eventSelector - The CSS selector for the event elements.
 * @param {string} eventNameSelector - The CSS selector for the event name elements.
 * @param {string} oddsSelector - The CSS selector for the odds elements.
 * @returns {Object} The event data from the last element.
 */
async function scrapeLastElementData(page, eventSelector, eventNameSelector, oddsSelector) {
    const elements = await page.$$(eventSelector);
    const lastElement = elements[elements.length - 1];
    if (!lastElement) return null;

    const eventName = await page.evaluate((element, eventNameSelector) => {
        const eventNameElement = element.querySelector(eventNameSelector);
        return eventNameElement ? eventNameElement.textContent.trim() : "";
    }, lastElement, eventNameSelector);

    const oddsElements = await lastElement.$$(oddsSelector);
    const odds = oddsElements
        ? await Promise.all(oddsElements.map(oddsElement => page.evaluate(element => element.textContent.trim(), oddsElement: [];

    return { eventName, odds };
}

runScraping();
