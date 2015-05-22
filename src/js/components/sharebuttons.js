export default class ShareButtons {
    constructor(opts) {
        this.opts = opts;
        this.el = opts.el;
        this.shortUrl = opts.shortUrl;
        this.headline = opts.headline;
        this.el.innerHTML = this.HTML;
    }

    get HTML() {
        return `
        <div class="visuals-share-btns">
            <a target="_blank" data-source="twitter"  href=${this.twitterShareUrl}></a>
            <a target="_blank" data-source="facebook" href=${this.facebookShareUrl}></a>
            <a target="_blank" data-source="email" href="${this.emailMailto}"></a>
            <a target="_blank" data-source="linkedin" href=${this.linkedinShareUrl}></a>
            <a target="_blank" data-source="gplus" href=${this.gplusShareUrl}></a>
        </div>`
    }

    // SHARE URLS
    // ********************

    getShortUrl(site) {
        var campaginCodes = {
            // campaign codes don't work with linked in as they resolve redirects
            twitter: 'stw',
            facebook: 'sfb',
            email: 'sbl',
            gplus: 'sgp'
        }

        return `${this.shortUrl}/${campaginCodes[site]}`;
    }

    get twitterShareUrl() {
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(this.headline)}&url=${encodeURIComponent(this.getShortUrl('twitter'))}`;
    }

    get linkedinShareUrl() {
        return `http://www.linkedin.com/shareArticle?mini=true&title=${encodeURIComponent(this.headline)}&url=${encodeURIComponent(this.shortUrl)}`
    }

    get facebookShareUrl() {
        var facebookParams = [
            ['display', 'popup'],
            ['app_id', '741666719251986'],
            ['link', encodeURIComponent(this.getShortUrl('facebook'))],
            ['redirect_uri', 'http://www.facebook.com']
        ];
        var queryString = facebookParams.map(pair => pair.join('=')).join('&');
        return 'https://www.facebook.com/dialog/feed?' + queryString;
    }

    get emailMailto() {
        return `mailto:?subject=${encodeURIComponent(this.headline)}&body=${encodeURIComponent(this.getShortUrl('email'))}`
    }

    get gplusShareUrl() {
        return `https://plus.google.com/share?url=${encodeURIComponent(this.getShortUrl('gplus'))}`;
    }
}
