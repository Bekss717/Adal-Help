const axios = require('axios')

let ratesCache = null
let cacheTime  = null
const CACHE_MS = 60 * 60 * 1000  // 1 hour

const getFallbackRates = () => ({
  KGS: 1, USD: 0.01127, EUR: 0.01039,
  RUB: 0.9854, KZT: 5.412, GBP: 0.00889,
  CNY: 0.08178, TRY: 0.3614, AED: 0.04138,
})

const getExchangeRates = async () => {
  if (ratesCache && Date.now() - cacheTime < CACHE_MS) return ratesCache

  try {
    const key = process.env.EXCHANGE_RATE_API_KEY
    if (!key) return getFallbackRates()

    const { data } = await axios.get(
      `https://v6.exchangerate-api.com/v6/${key}/latest/KGS`,
      { timeout: 5000 }
    )
    if (data.result === 'success') {
      ratesCache = data.conversion_rates
      cacheTime  = Date.now()
      return ratesCache
    }
  } catch {
    console.warn('Currency API failed, using fallback rates.')
  }
  return getFallbackRates()
}

// Convert any currency → KGS
const convertToKGS = async (amount, fromCurrency) => {
  const cur = fromCurrency.toUpperCase()
  if (cur === 'KGS') return { amountKGS: amount, rate: 1 }

  const rates = await getExchangeRates()
  const rate  = rates[cur]
  if (!rate) throw new Error(`Currency ${cur} is not supported.`)

  const amountKGS = Math.round((amount / rate) * 100) / 100
  const rateToKGS = Math.round((1 / rate) * 100) / 100
  return { amountKGS, rate: rateToKGS }
}

module.exports = { convertToKGS, getExchangeRates }