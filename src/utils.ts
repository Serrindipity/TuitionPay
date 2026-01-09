let Page: import('playwright').Page;
export const goToOverview = async (page: typeof Page) => {
    /*
    Navigates to the Overview page from anywhere.
    */
    await page.getByRole('link', { name: 'Overview' }).click();
}

export const goToMakePayment = async (page: typeof Page) => {
    /*
    Navigates to the Make a Payment page from anywhere.
    */
    await page.getByRole('link', { name: 'Make a payment', exact: true }).click();
}

export const clickTheStupidInitialPopup = async (page: typeof Page) => {
    /*
    Clicks the initial popup that appears on the Overview page.
    */
    const popup = await page.getByText('Notifications IMPORTANT: *');
    console.log(popup)
    if (popup) {
        await page.getByRole('button', { name: 'Close notifications dialog' }).click();
        console.log('Closed initial popup.');
    } else {
        console.log('No initial popup to close.');
    }
}