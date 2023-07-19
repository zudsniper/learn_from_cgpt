// scraper.js
// generated with ChatGPT3.5 May 24th version
// ------------------------------------------
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

puppeteer.launch({ headless: false }).then(async (browser) => {
  console.log("Running tests...");
  // await page.waitForSelector(".sport-area__grow__scrollable--5vYw3D");

  async function scrollUntilDataLoaded(page) {
    const scrollerSelector = ".sport-area__grow__scrollable--5vYw3D"; // Replace with the correct selector
    const distance = 50;
    const delay = 200;

    let previousHeight = await page.$eval(
      scrollerSelector,
      (scroller) => scroller.scrollHeight
    );

    let retries = 0;
    const maxRetries = 3;
    let isPageFullyLoaded = false;

    while (retries < maxRetries) {
      await page.evaluate(
        (selector, scrollDistance) => {
          const scroller = document.querySelector(selector);
          scroller.scrollBy(0, scrollDistance);
        },
        scrollerSelector,
        distance
      );

      await page.waitForTimeout(delay);

      const newHeight = await page.$eval(
        scrollerSelector,
        (scroller) => scroller.scrollHeight
      );

      if (newHeight === previousHeight) {
        retries++;
      } else {
        retries = 0;
      }

      previousHeight = newHeight;

      // Check if the current height matches the previous height for the specified number of retries
      if (retries === maxRetries) {
        isPageFullyLoaded = true;
        break;
      }
    }

    if (!isPageFullyLoaded) {
      // Wait for a brief moment to ensure any remaining elements are loaded
      await page.waitForTimeout(500);
    }
  }

  async function scrollToLastElement(page) {
    await page.evaluate(async () => {
      const checkLastElement = () =>
        new Promise((resolve) => {
          const elements = document.querySelectorAll(
            ".sport-base-event--pDx9cf._compact--5fB1ok"
          );
          const lastElement = elements[elements.length - 1];

          if (lastElement) {
            lastElement.scrollIntoView();
            resolve();
          } else {
            setTimeout(checkLastElement, 100);
          }
        });

      await checkLastElement();
    });
  }

  async function scrapeData(page) {
    const eventList = await page.$$eval(
      ".sport-base-event--pDx9cf._compact--5fB1ok",
      (elements) =>
        elements.map((element) => {
          const eventNameElement = element.querySelector(
            ".sport-event__name--HefZLq"
          );
          const eventName = eventNameElement
            ? eventNameElement.textContent.trim()
            : "";

          const oddsElements = element.querySelectorAll(
            ".table-component-factor-value_single--6nfox5"
          );
          const odds = Array.from(oddsElements).map((oddsElement) =>
            oddsElement.textContent.trim()
          );

          return { eventName, odds };
        })
    );

    return eventList;
  }

  async function scrapeLastElementData(page) {
    const elements = await page.$$(
      ".sport-base-event--pDx9cf._compact--5fB1ok"
    );
    const lastElement = elements[elements.length - 1];

    if (!lastElement) {
      return null;
    }

    let eventName = "";
    let retryAttempts = 0;
    const maxRetryAttempts = 3;

    while (!eventName && retryAttempts < maxRetryAttempts) {
      await page.waitForTimeout(500);

      eventName = await page.evaluate((element) => {
        const eventNameElement = element.querySelector(
          ".sport-event__name--HefZLq, .sport-event__name--3q6wmr"
        );
        return eventNameElement ? eventNameElement.textContent.trim() : "";
      }, lastElement);

      retryAttempts++;
    }

    if (!eventName) {
      return null;
    }

    const oddsElements = await lastElement.$$(
      ".table-component-factor-value_single--6nfox5"
    );
    const odds = oddsElements
      ? await Promise.all(
          Array.from(oddsElements).map(async (oddsElement) => {
            const textContent = oddsElement
              ? await page.evaluate(
                  (element) => element.textContent.trim(),
                  oddsElement
                )
              : "";
            return textContent || "";
          })
        )
      : [];

    return { eventName, odds };
  }

  async function runScraping() {
    const page = await browser.newPage();
    await page.goto("https://www.fon.bet/sports/football/?mode=1");

    await page.waitForSelector(".sport-area__grow__scrollable--5vYw3D");

    let previousDataCount = 0;
    let currentDataCount = 0;
    let eventList = [];

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      await scrollUntilDataLoaded(page);

      const newData = await scrapeData(page);
      eventList = eventList.concat(newData);

      currentDataCount = eventList.length;
      if (currentDataCount === previousDataCount) {
        retries++;
      } else {
        retries = 0;
      }

      previousDataCount = currentDataCount;

      await scrollToLastElement(page);

      let lastElementData = await scrapeLastElementData(page);
      let retryAttempts = 0;

      while (!lastElementData && retryAttempts < maxRetries) {
        await page.waitForTimeout(500);

        lastElementData = await scrapeLastElementData(page);
        retryAttempts++;
      }

      if (lastElementData) {
        eventList.push(lastElementData);
      } else {
        const lastElement = await page.$(
          ".sport-base-event--pDx9cf._compact--5fB1ok:last-child"
        );
        if (!lastElement) {
          break;
        }
      }

      await page.waitForTimeout(500);
    }

    console.log("Scraped data:", eventList);

    await browser.close();
  }

  runScraping();
});