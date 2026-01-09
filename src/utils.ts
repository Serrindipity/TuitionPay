let Page: import('playwright').Page;
export const goToOverview = async (page: typeof Page) => {
    /*
    Navigates to the Overview page from anywhere, or stays if already there.
    */

    if (!(await page.title()).includes('Overview')) {
        await page.getByRole('link', { name: 'Overview' }).first().click();
    }
}

export const goToMakePayment = async (page: typeof Page) => {
    /*
    Navigates to the Make a Payment page from anywhere, or stays there if already there.
    */
    if (!(await page.title()).includes('Make a Payment')) {
        await page.getByRole('link', { name: 'Make a Payment' }).first().click();
    }
}
export const clickTheStupidInitialPopup = async (page: typeof Page) => {
    /*
    Clicks the initial popup that appears on the Overview page.
    */
    const popup = await page.getByText('Notifications IMPORTANT: *');
    if (popup) {
        await page.getByRole('button', { name: 'Close notifications dialog' }).click();
        console.log('Closed initial popup.');
    } else {
        console.log('No initial popup to close.');
    }
}