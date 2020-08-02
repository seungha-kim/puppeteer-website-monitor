require('dotenv').config()
const express = require('express')
const puppeteer = require('puppeteer')
const axios = require('axios')

const sites = require('./sites')


const {SLACK_BOT_TOKEN, SLACK_CHANNEL_ID} = process.env
const PORT = process.env.PORT || 8080

const app = express()
const browserPromise = puppeteer.launch({
  args: [
    '--no-sandbox',
    '--single-process',
  ],
});

async function postSlackMessage(message) {
  console.log('[postSlackMessage]', message)
  axios.post('https://slack.com/api/chat.postMessage', {
    channel: SLACK_CHANNEL_ID,
    text: message
  }, {
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
    }
  })
}

async function checkSites() {
  try {
    const browser = await browserPromise
    const page = await browser.newPage();
    try {
      for (const {name, target, selector} of sites) {
        await page.goto(target);
        try {
          await page.waitFor(selector, {timeout: 10000})
          postSlackMessage(`Good: ${name} (${target})`)
        } catch (e) {
          postSlackMessage(`<!channel> Bad: ${name} (${target})`)
          console.error('[checkSites]', e)
        }
      }
    } finally {
      page.close()
    }
  } catch (e) {
    console.error('[checkSites]', e)
  }
}

app.get('/checkSites', (req, res) => {
  checkSites()
  res.json({ok: true})
})

app.listen(PORT, () => {
  console.log(`listening ${PORT}...`)
})
