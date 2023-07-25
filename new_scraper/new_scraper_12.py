from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import undetected_chromedriver as uc

# Constants
SCROLLER_SELECTOR = ".sport-area__grow__scrollable--5vYw3D"
EVENT_SELECTOR = ".sport-base-event--pDx9cf._compact--5fB1ok"
EVENT_NAME_SELECTOR = ".sport-event__name--HefZLq"
ODDS_SELECTOR = ".table-component-factor-value_single--6nfox5"
URL = "https://www.fon.bet/sports/football/?mode=1"

def run_scraping():
    print("Starting the browser...")
    options = uc.ChromeOptions()
    options.headless = False
    driver = uc.Chrome(options=options)

    print("Navigating to the page...")
    driver.get(URL)

    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, SCROLLER_SELECTOR)))

    event_list = []

    while True:
        print("Scrolling until data is loaded...")
        scroll_until_data_loaded(driver, SCROLLER_SELECTOR)
        print("Scraping data...")
        new_data = scrape_data(driver, EVENT_SELECTOR, EVENT_NAME_SELECTOR, ODDS_SELECTOR)
        event_list.extend(new_data)

        print("Scraping last element data...")
        last_element_data = scrape_last_element_data(driver, EVENT_SELECTOR, EVENT_NAME_SELECTOR, ODDS_SELECTOR)
        if not last_element_data:
            break

        event_list.append(last_element_data)
        time.sleep(0.5)

    print("Scraped data:", event_list)
    print("Closing the browser...")
    driver.quit()

def scroll_until_data_loaded(driver, scroller_selector):
    distance = 50
    delay = 0.2
    max_retries = 3
    retries = 0
    previous_height = driver.execute_script(f"return document.querySelector('{scroller_selector}').scrollHeight")

    while retries < max_retries:
        print("Scrolling the page...")
        driver.execute_script(f"document.querySelector('{scroller_selector}').scrollBy(0, {distance})")
        time.sleep(delay)

        new_height = driver.execute_script(f"return document.querySelector('{scroller_selector}').scrollHeight")
        if new_height == previous_height:
            retries += 1
        else:
            retries = 0

        previous_height = new_height
        if retries == max_retries:
            break

    time.sleep(0.5)

def scrape_data(driver, event_selector, event_name_selector, odds_selector):
    elements = driver.find_elements_by_css_selector(event_selector)
    return [
        {
            "eventName": element.find_element_by_css_selector(event_name_selector).text.strip(),
            "odds": [odd.text.strip() for odd in element.find_elements_by_css_selector(odds_selector)]
        }
        for element in elements
    ]

def scrape_last_element_data(driver, event_selector, event_name_selector, odds_selector):
    elements = driver.find_elements_by_css_selector(event_selector)
    last_element = elements[-1] if elements else None
    if not last_element:
        return None

    event_name = last_element.find_element_by_css_selector(event_name_selector).text.strip()
    odds_elements = last_element.find_elements_by_css_selector(odds_selector)
    odds = [odd.text.strip() for odd in odds_elements]

    return {"eventName": event_name, "odds": odds}

run_scraping()
