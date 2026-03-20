async function run() {
    const key = 'AIzaSyAW9pShzkcJ85nPkxemJJ98bXQ8MxR4tbE';
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data.models.map(m => m.name).join(', '));
    } catch(e) {
        console.error(e);
    }
}
run();
