export default class Animation {
    constructor(opts) {
        this.el = opts.el;
        this.animationEl = opts.el;

        if(!this.isMobile){
            this.animationEl.innerHTML = this.HTML;
            this.peopleAnimEl = this.el.querySelector('.ug16__anim--people')
            this.startAnimations();
        } else {
           this.animationEl.innerHTML = this.mobileHTML;
        }
    }

    get isMobile() {
        return window.innerWidth < 660;
    }

    get HTML() {
        return `
            <div class="head-area">
                <div class="head-content">
                    <div class="head-content-left">
                        <h4>University guide</h4>
                        <h5>Guardian students</h5>
                    </div>
                    <div class="head-content-main">
                        <h1 id="headStack1">University guide</h1>
                        <h1 id="headStack2" style="color:#aad8f1">Subject here</h1>
                        <p id="headStackStandFirst">Standy standfirst</p>
                    </div>
                </div>
            </div>

            <div class="ug16__animation-holder">
                <div class="ug16__anim ug16__anim--panels"></div>
                <div class="ug16__anim ug16__anim--skyline"></div>
                <div class="ug16__anim ug16__anim--bg"></div>
                <div class="ug16__anim ug16__anim--people"></div>
                <div class="ug16__anim ug16__anim--fg"></div>
            </div>`;
    }

    get mobileHTML() {
        return `
        <div class="head-area">
            <div class="head-content">

                <div class="head-content-left-mobile">
                    <h6>University guide</h6>
                    <h7>Guardian students</h7>
                </div>

                <div class="head-content-main-mobile">
                    <h5 id="headStack1">University guide</h1>
                    <h5 id="headStack2" style="color:#aad8f1">Subject here</h1>
                    <p id="headStackStandFirst">Standy standfirst</p>
                </div>

            </div>
        </div>
        <div class="static-image-holder"></div>`;
    }


    peopleAnimation() {
        this.peopleRef = (this.peopleRef - 450) % 1350;
        this.peopleAnimEl.style.backgroundPositionY = this.peopleRef + 'px'
    }

    startAnimation(fn, interval) {
        var raf = window.requestAnimationFrame || ( (fn) => window.setTimeout(fn, 1) );
        var animFn = raf.bind(window, fn);
        window.setInterval(animFn, interval)
    }

    startAnimations() {
        this.peopleRef = 0;
        this.startAnimation(this.peopleAnimation.bind(this), 150);
    }

}