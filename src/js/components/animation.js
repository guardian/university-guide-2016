export default class Animation {
    constructor(opts) {
        var el = opts.el;
        this.animationEl = opts.el;

        if(!this.isMobile){
            this.animationEl.innerHTML = this.HTML;
            this.peopleAnimEl = el.querySelector('#peopleAnim')
            this.bg1el = el.querySelector('#bg1')
            this.bg2el = el.querySelector('#bg2')
            this.bg3el = el.querySelector('#bg3')
            this.bg4el = el.querySelector('#bg4')
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

            <div class="animation-holder">
                <div class="bg-3" id="bg3"></div>
                <div class="bg-4" id="bg4"></div>
                <div class="bg-2" id="bg2"></div>
                <div class="people" id="peopleAnim"></div>
                <div class="bg-1" id="bg1"></div>
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
        this.peopleRef = this.peopleRef-450;
        this.peopleAnimEl.style.backgroundPositionY = this.peopleRef+'px'
    }

    fgAnimation() {
        this.fgRef = this.fgRef-1;
        this.bg1el.style.backgroundPosition = this.fgRef+'px 0'
    }

    bgAnimation() {
        this.bgRef = this.bgRef-1;
        this.bg2el.style.backgroundPosition = this.bgRef+'px 0'
    }

    panelsAnimation() {
        this.panelsRef = this.panelsRef-1;
        this.bg3el.style.backgroundPosition = this.panelsRef+'px 0'
    }

    skylineAnimation() {
        this.skylineRef = this.skylineRef-1;
        this.bg4el.style.backgroundPosition = this.skylineRef+'px 0'
    }

    startAnimations() {

        this.fgRef = 1000;
        this.bgRef = 1000;
        this.peopleRef = 1350;
        this.panelsRef = 1000;
        this.skylineRef = 1000;

        setInterval(this.fgAnimation.bind(this),10);
        setInterval(this.bgAnimation.bind(this),30);
        setInterval(this.panelsAnimation.bind(this),70);
        setInterval(this.peopleAnimation.bind(this),150);
        setInterval(this.skylineAnimation.bind(this),80);
    }

}