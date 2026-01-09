# Automate paying tuition with a whole bunch of gift cards
Ever ran into a problem where you were trying to pay your tuition, but you only had single-use gift cards? No? Well for some reason, I have...

Currently only supports UC Berkeley (lol)

### To solve a problem that no-one else has :(

> I built this since due to credit-card point shenanigans, it has been economically optimal to buy visa / mastercard prepaid debit cards at stores like Staples or Target, get the points for them, and then use them for purchases such as this. The **TARGET_PAYMENT** feature was inspired since as a TA, I get fee remission, which refunds some portion of the tuition that I paid. Unfortunately, it will refund to a random assortment of cards, and without the transaction fee, unless you pay exactly how much you need without going over (so they don't have to refund).

# Env setup
Make a copy of the .env.template file:
```sh
cp .env.template .env
```

Edit the values as needed.

- **PORTAL_URL:** The main place you go to pay tuition
- **AMOUNT_PER_CARD:** The total on each card. It will automatically calculate the transaction fee and what's actually paid.
- **ZIP_CODE:** Zip code for the cards
- **CARDS_CSV:** path to the csv that has your card info. See the sample csv files for examples.
- **USERNAME:** Portal username
- **PASSWORD:** Portal password
- **HEADLESS:** If you need to sign in using 2FA, set this to false. It will also keep the browser open at the end in case you need to do some troubleshooting.
- **TARGET_PAYMENT:** If you only want to pay only a certain amount, set this value. It will stop just before a payment that would meet or exceed that value. (Again, solving problems no-one else has...)

# CSV Format
look at `sample_cards.csv`