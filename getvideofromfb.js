const puppeteer = require('puppeteer');
const { URL } = require('url');
const fs = require('fs');
const request = require('request');

(async () => {
	const spitLinkError = () => { console.log('Não consegui encontrar o vídeo, o link está correto?'); }

	if(process.argv.length <= 2){
		console.log("Insira o link da página do vídeo como argumento");
		process.exit(-1);
	}

	const browser = await puppeteer.launch();
	try {
		new URL(process.argv[2]);
	} catch (err) {
		spitLinkError()
		browser.close();
		process.exit(-1);
	}

	const isFromFb = (url) => {
		return ["www.facebook.com",
		    "facebook.com",
		    "www.fb.com",
		    "fb.com",
		    "m.facebook.com",
		    "mobile.facebook.com"
		   ].includes(url)
	}

	const link = new URL(process.argv[2]);

	if (isFromFb(link.host)) {
		const page = await browser.newPage();
		await page.goto("http://m.facebook.com" + 
						 link.href.substring(link.origin.length, link.href.length),
						{waitUntil: 'networkidle'})

		await page.click('#u_0_0 > div > div > div > div > div > i')
				  .catch((error) => {
				  	spitLinkError()
				  	browser.close();
				  	process.exit(-1);
				  });

		await page.waitForSelector('#mInlineVideoPlayer', {visible: true});

		// Pega o link do video da página
		const videoLink = await page.evaluate(() => {
			return document.getElementById('mInlineVideoPlayer').src;
		});

		const date = new Date();

		request
			.get(videoLink, {timeout: 3000000})
			.on('error', function(err) {
				console.log("Erro ao baixar vídeo :(")
			})
			.pipe(fs.createWriteStream('video' + date.getTime().toString() + '.mp4'));

		console.log('Video baixado em ' + 'video' + date.getTime().toString() + '.mp4')
		
	} else {
		spitLinkError();
	}
  	
  	browser.close();
})();