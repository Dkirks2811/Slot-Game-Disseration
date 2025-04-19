class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        this.createLoadingBar();
        
        this.load.image('symbol1', './img1.png');
        this.load.image('symbol2', './img2.png');
        this.load.image('symbol3', './img3.png');
        this.load.image('symbol4', './img4.png');
        this.load.image('symbol5', './img5.png');
        this.load.image('symbol6', './img6.png');
        this.load.image('symbol7', './img7.png');
        this.load.image('symbol8', './img8.png');
        this.load.image('spinButton', './buttonSpin.png');
        this.load.image('background', './background.png'); 
        this.load.audio('reelStop', './stopReel.mp3');
        this.load.audio('buttonPress', './clickSpin.mp3'); 
        this.load.audio('winSound', './winSound.mp3');
        this.load.audio('bigWin', './bigWin.mp3');
        this.load.image('bonusSymbol', './bonus.png'); 
        this.load.audio('suspenseSound', './suspense.mp3');
        this.load.audio('bonusStart', './bonusStart.mp3');
        this.load.image('goldGlow', './goldGlow.webp');
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.loadingText = this.add.text(width/2, height/2 - 50, 'Loading...', {
            font: '20px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x55555, 0.8);
        progressBox.fillRect(width/2 - 160, height/2, 320, 50);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width/2 - 150, height/2 + 10, 300 * value, 30);
        });
    }

    create() {
        this.time.delayedCall(2000, () => {
            this.scene.start('MainScene');
        });
    }
    // Code adapted from Mitchell Hudson (2019) & Westover (2024) 
}

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');

        //Code adapted from John McCaffrey (2020)
        
        this.reelCount = 4;
        this.symbolCount = 3; 
        this.spinDuration = 400; 
        this.symbolHeight = 100; 
        this.reelStopDelay = 300;
        
        this.reels = [];
        this.isSpinning = false;
        this.coins = 1000;
        this.coinBefore = 0;
        this.betAmount = 10;
        this.isInBonusMode = false;
        this.bonusTriggered = false;
        this.bonusSymbolCount = 0;
        this.sessionStartCoins = this.coins;
        this.lastSpinTime = 0;
        this.freeSpinsLeft = 0;
        this.bonusAchieved = false;
        this.reminderBox;
        this.reminderText;
        
        this.paylines = [
            [1, 1, 1, 1], 
            [2, 2, 2, 2], 
            [3, 3, 3, 3], 
            [1, 2, 3, 2], 
            [3, 2, 1, 2], 
            [1, 1, 2, 3], 
            [3, 3, 2, 1], 
            [2, 1, 1, 1], 
            [2, 3, 3, 3], 
            [1, 2, 2, 2], 
            [3, 2, 2, 2], 
            [1, 2, 1, 2], 
            [3, 2, 3, 2], 
            [1, 3, 2, 1], 
            [3, 1, 2, 3], 
            [1, 2, 2, 3], 
            [1, 1, 1, -1], 
            [2, 2, 2, -1], 
            [3, 3, 3, -1], 
            [1, 2, 3, -1], 
            [3, 2, 1, -1], 
            [1, 1, 2, -1], 
            [3, 3, 2, -1], 
            [2, 1, 1, -1], 
            [2, 3, 3, -1], 
            [1, 2, 2, -1], 
            [3, 2, 2, -1], 
            [1, 2, 1, -1], 
            [3, 2, 3, -1], 
            [1, 3, 2, -1], 
            [3, 1, 2, -1], 
            [1, 2, 2, -1],  
            [2, 3, 2, -1],
            [2, 2, 3, 3],
            [2, 3, 3, -1],
            [3, 2, 1, 1],
            [1, 2, 3, 3],
            [2, 1, 2, -1],
            [2, 1, 2, 1],
            [3, 2, 3, 2],
            [3, 2, 3, -1]
        ];
    }

    create() {
        this.add.image(400, 300, 'background').setDisplaySize(800, 600);
        
        this.initReels();
        this.initUI();
        this.initButtons();

        this.reminderEvent = this.time.addEvent({
            delay: 300000,
            loop: true,
            callback: this.showBreakReminder,
            callbackScope: this 
        });

    }

    initReels() {
        const reelWidth = 140; 
        const totalReelWidth = this.reelCount * reelWidth; 
        const startX = (800 - totalReelWidth) / 2 + reelWidth / 2; 
        const startY = 200;
        
        for (let i = 0; i < this.reelCount; i++) {
            let reel = [];
            for (let j = 0; j < this.symbolCount; j++) {
                let randomSymbol = Phaser.Math.Between(1, 8);
                let symbol = this.add.sprite(startX + i * reelWidth, startY + j * this.symbolHeight, `symbol${randomSymbol}`);
                symbol.setScale(this.symbolHeight / 450); 
                reel.push(symbol);
            }
            this.reels.push(reel);
        }
    }

    initUI() {

        if (this.reminderText && this.reminderText.active) {
            this.reminderText.destroy();
            this.reminderBox.destroy();
        }

        this.coinText = this.add.text(142, 527, `Coins: ${this.coins}`, { 
            fontSize: '22px', 
            fill: '#fff', 
            fontFamily: 'Lilita One', 
            stroke: '#000', 
            strokeThickness: 3
        }).setAngle(4);
        
        this.profitLossText = this.add.text(20, 10, 'Profit/Loss: 0', {
            fontSize: '20px',
            fill: '#ff3333',
            fontFamily: 'Lilita One',
            stroke: '#000',
            strokeThickness: 3
        });
        
        this.freeSpinsText = this.add.text(650, 50, '', {
            fontSize: '22px',
            fill: '#fff',
            fontFamily: 'Lilita One',
            stroke: '#000',
            strokeThickness: 3,
        }).setVisible(false);
        
        this.goldGlow = this.add.image(400, 300, 'goldGlow')
            .setDisplaySize(800, 600)
            .setDepth(20)
            .setVisible(false);
    }

    initButtons() {
        const reelWidth = 140;
        const totalReelWidth = this.reelCount * reelWidth;
        const startY = 200;
        
        this.spinButton = this.add.sprite(400, startY + this.symbolCount * this.symbolHeight + 50, 'spinButton')
            .setInteractive()
            .setScale(1.25);

        
        this.spinButton.on('pointerdown', () => {
            this.cleanupReminder();

            if (this.isSpinning) return;
            
            const now = Date.now();
            if (now - this.lastSpinTime < 2500) return;
            this.lastSpinTime = now;
        
            this.sound.play('buttonPress');
            this.spinButton.setScale(1.1);
            this.tweens.add({
                targets: this.spinButton,
                scaleX: 1.25,
                scaleY: 1.25,
                duration: 150,
                ease: 'Bounce.easeOut',
            });
        
            this.startSpin();
        });
        
        const maxBet = 50;        
        const minusButton = this.add.text(670, 548, '-', {
            fontSize: '32px',
            backgroundColor: '#346564',
            color: '#fff',
            fontFamily: 'Lilita One',
            padding: { x: 15, y: 10 },
            align: 'center',
        }).setOrigin(0.5).setInteractive().setDepth(10).setScale(0.8);
        
        const plusButton = this.add.text(530, 548, '+', {
            fontSize: '32px',
            backgroundColor: '#346564',
            color: '#fff',
            fontFamily: 'Lilita One',
            padding: { x: 15, y: 10 },
            align: 'center',
        }).setOrigin(0.5).setInteractive().setDepth(10).setScale(0.8);
        
        this.betText = this.add.text(600, 548, `${this.betAmount} coins`, {
            fontSize: '22px',
            fill: '#fff',
            fontFamily: 'Lilita One',
            stroke: '#000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(10);
        
        minusButton.on('pointerdown', () => {
            if (this.betAmount > 1) {
                this.betAmount--;
                this.updateBetDisplay();
                this.sound.play('buttonPress');

                this.tweens.add({
                    targets: minusButton,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    ease: 'Bounce.easeOut',
                    yoyo: true
                });
            }
        });
        
        plusButton.on('pointerdown', () => {
            if (this.betAmount < maxBet) {
                this.betAmount++;
                this.updateBetDisplay();
                this.sound.play('buttonPress');

                this.tweens.add({
                    targets: plusButton,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 100,
                    ease: 'Bounce.easeOut',
                    yoyo: true

                });
            }
        });
    }
    showBreakReminder() {
        if (this.reminderBox?.active || this.isSpinning) return;

        if (this.reminderBox) {
            this.reminderBox.destroy();
        }
        if (this.reminderText) {
            this.reminderText.destroy();
        }

        this.reminderBox = this.add.rectangle(400, 300, 400, 100, 0x000000, 0.7)
            .setOrigin(0.5)
            .setDepth(25)
            .setScale(0);

        this.reminderText = this.add.text(400, 300, 'Reminder: Take a break!', {
            fontSize: '24px',
            fill: '#FF0000',
            fontFamily: 'Lilita One',
            stroke: '#000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(26)
        .setScale(0);

        this.tweens.add({
            targets: [this.reminderBox, this.reminderText],
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });

    }

    updateBetDisplay() {
        this.betText.setText(`${this.betAmount} coins`);
    }

    startSpin() {
        if (this.isSpinning || (this.coins < this.betAmount && !this.isInBonusMode) || (this.isInBonusMode && this.freeSpinsLeft <= 0)) {
            if (this.coins < this.betAmount && !this.isInBonusMode) {
                this.showLowBalancePopup();
            }
            return;
        }
        this.isSpinning = true;
    
        if (this.bonusAchieved) {
            this.startBonusMode();
            this.bonusAchieved = false;
        }
    
        if (!this.isInBonusMode) {
            this.coins -= this.betAmount;
            this.coinBefore = this.coins;
        }
        this.updateCoinText();
    
        let reelsFinished = 0;
    
        this.reels.forEach((reel, index) => {
            const delay = index * this.reelStopDelay;
            const spinSpeed = this.isInBonusMode ? this.spinDuration * 1.5 : this.spinDuration;
    
            this.spinReel(reel, index, spinSpeed, () => {
                reelsFinished++;
                if (reelsFinished === this.reelCount) {
                    this.isSpinning = false;
                    this.calculatePayout();
    
                    if (this.isInBonusMode) {
                        this.freeSpinsText.setText(`Free Spins: ${this.freeSpinsLeft}`);
    
                        if (this.freeSpinsLeft === 1) {
                            this.endBonusMode();
                        }
    
                        this.freeSpinsLeft--;
                    }
                }
            });
        });
    }


    spinReel(reel, index, spinSpeed, onComplete) {
        const spinCycles = this.isInBonusMode ? 8 : 5; 
        const spinDurationPerCycle = spinSpeed / spinCycles;
    
        const spinTween = this.tweens.addCounter({
            from: 0,
            to: this.symbolHeight * spinCycles * this.symbolCount,
            duration: spinSpeed + index * this.reelStopDelay,
            ease: 'Cubic.easeInOut',
            onUpdate: (tween) => {
                const value = tween.getValue();
                reel.forEach((symbol) => {
                    symbol.y = -100 - (symbol.y / (this.symbolHeight)); 

                });
            },
            onComplete: () => {
                reel.forEach((symbol, positionIndex) => {
                    const randomSymbol = Phaser.Math.Between(1, 8);
                    const isBonus = !this.isInBonusMode && Phaser.Math.Between(1, 250) === 2;
                    symbol.setTexture(isBonus ? 'bonusSymbol' : `symbol${randomSymbol}`);
    
                    if (isBonus) {
                        this.bonusSymbolCount++;
                        this.sound.play('suspenseSound');
    
                        if (this.bonusSymbolCount >= 2) {
                            this.bonusAchieved = true;
                        }
                    }
                });
    
                reel.forEach((symbol, positionIndex) => {
                    const finalY = 200 + positionIndex * this.symbolHeight;
                    this.tweens.add({
                        targets: symbol,
                        y: finalY,
                        duration: 200,
                        ease: 'Bounce.easeOut',
                        onComplete: () => {
                            this.sound.play('reelStop');
                            if (positionIndex === reel.length - 1) {
                                if (onComplete) onComplete();
                            }
                        }
                    });
                });
            }
        });
    }

    updateCoinText() {
        this.coinText.setText(`Coins: ${this.coins}`);
    
        let net = this.coins - this.sessionStartCoins;
        let displayValue = net >= 0 ? `+${net}` : `${net}`;
        this.profitLossText.setText(`Profit/Loss: ${displayValue}`);
    }

    calculatePayout() {
        let won = false;
        let totalWin = 0;
        let isBigWin = false;
    
        const bigWinThreshold = this.betAmount * 20; 
    
        this.bonusSymbolCount = 0;
        this.paylines.forEach((line) => {
            const lineSymbols = line.map((row, reelIndex) => {
                if (row === -1) return null;
                return this.reels[reelIndex][row - 1].texture.key;
            });
    
            const baseSymbol = lineSymbols.find((symbol) => symbol !== null);
            const allMatch = lineSymbols.every(
                (symbol) => symbol === null || symbol === baseSymbol
            );
    
            if (allMatch && baseSymbol) {
                let payouts = this.getPayouts();
                let payout = payouts[baseSymbol] || 0;
                
                if (this.isInBonusMode) payout *= 10;
    
                this.coins += payout;
                totalWin += payout;
                won = true;
    
                if (totalWin >= bigWinThreshold) {
                    isBigWin = true;
                }
            }
        });
    
        this.updateCoinText();
    
        if (won) {
            if (isBigWin) {
                this.sound.play('bigWin');
                this.showBigWinPopup(totalWin);
            } else {
                this.sound.play('winSound');
                this.showWinPopup(totalWin);
            }
        }
    
        if (this.bonusAchieved) {
            this.sound.play('bonusStart');
            this.showBonusPopup();
        }
    
        if (this.isInBonusMode && this.freeSpinsLeft >= 0) {
            this.time.delayedCall(1500, () => this.startSpin());
        }
    }

    getPayouts() {
        return {
            symbol1: this.betAmount,
            symbol2: this.betAmount * 2,
            symbol3: this.betAmount * 3,
            symbol4: this.betAmount * 4,
            symbol5: this.betAmount * 5,
            symbol6: this.betAmount * 6,
            symbol7: this.betAmount * 7,
            symbol8: this.betAmount * 10
        };
    }

    startBonusMode() {
        this.bonusTriggered = true;
        this.isInBonusMode = true;
        this.freeSpinsLeft = 8;
    
        this.goldGlow.setVisible(true);
        this.tweens.add({
            targets: this.goldGlow,
            alpha: 0.2, 
            duration: 1000,
            ease: 'Linear'
        });
    
        this.freeSpinsText.setVisible(true).setText(`Free Spins: ${this.freeSpinsLeft}`);
    }

    showWinPopup(amount) {
        let winText = this.add.text(400, 100, `+${amount} Coins!`, {
            fontSize: '32px',
            fontFamily: 'Lilita One',
            fill: '#ffde59',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);
    
        this.tweens.add({
            targets: winText,
            y: 50, 
            alpha: 0, 
            duration: 2000,
            ease: 'Power1',
            onComplete: () => winText.destroy()
        });
    }

    showBonusPopup() {
        let bonusText = this.add.text(400, 100, `Bonus Achieved!`, {
            fontSize: '32px',
            fontFamily: 'Lilita One',
            fill: '#ffde59',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(10);
    
        this.tweens.add({
            targets: bonusText,
            y: 50, 
            alpha: 0, 
            duration: 2000,
            ease: 'Power1',
            onComplete: () => bonusText.destroy()
        });
    }

    showBigWinPopup(amount) {
        let bigWinContainer = this.add.container(400, 300).setDepth(15);
    
        let background = this.add.graphics();
        background.fillStyle(0x000000, 0.8);
        background.fillRect(-200, -100, 400, 200);
        background.setAlpha(0);
    
        let winText = this.add.text(0, 0, `BIG WIN!\n+${amount} Coins!`, {
            fontSize: '48px',
            fontFamily: 'Lilita One',
            fill: '#ffde59',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
    
        bigWinContainer.add([background, winText]);
    
        this.tweens.add({
            targets: background,
            alpha: 1,
            duration: 2000
        });
    
        this.tweens.add({
            targets: winText,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true,
            repeat: 3,
            duration: 2000
        });
    
        this.time.delayedCall(2000, () => {
            bigWinContainer.destroy();
        });
    }

    showBonusEndPopup(totalBonusWin) {
        let bonusWinContainer = this.add.container(400, 300).setDepth(20);
    
        let background = this.add.graphics();
        background.fillStyle(0x000000, 0.8);
        background.fillRect(-250, -125, 500, 250);
        background.setAlpha(1);
    
        let winText = this.add.text(0, -20, `BONUS COMPLETE!\nTotal Win: ${totalBonusWin} Coins!`, {
            fontSize: '36px',
            fontFamily: 'Lilita One',
            fill: '#ffde59',
            stroke: '#000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
    
        let continueText = this.add.text(0, 80, `Click Spin to Continue`, {
            fontSize: '24px',
            fontFamily: 'Lilita One',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        
        bonusWinContainer.add([background, winText, continueText]);
    
        this.isSpinning = true;
    
        for (let i = 0; i < 50; i++) {
            let confetti = this.add.rectangle(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(-50, 100),
                6, 12,
                Phaser.Display.Color.RandomRGB().color
            );
            confetti.setRotation(Phaser.Math.FloatBetween(-0.5, 0.5));
    
            this.tweens.add({
                targets: confetti,
                y: 650,
                x: confetti.x + Phaser.Math.Between(-100, 100),
                angle: Phaser.Math.Between(0, 360),
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Linear',
                onComplete: () => confetti.destroy()
            });

            //Confetti Code Adapted from Phaser Studio, Inc (2025a)
        }
    
        this.spinButton.once('pointerdown', () => {
            bonusWinContainer.destroy();
            this.isSpinning = false;
        });
    }

    endBonusMode() {
        this.isInBonusMode = false;
        this.goldGlow.setVisible(false);
        this.bonusTriggered = false;
        this.freeSpinsText.setVisible(false);
    
        let totalBonusWin = this.coins - this.coinBefore;
        this.showBonusEndPopup(totalBonusWin);
    }

    showLowBalancePopup() {
        let popup = this.add.container(400, 300).setDepth(20);
    
        let background = this.add.graphics();
        background.fillStyle(0x000000, 0.8);
        background.fillRoundedRect(-150, -50, 300, 100, 20);
        
        let warningText = this.add.text(0, 0, 'Not enough coins!', {
            fontSize: '26px',
            fontFamily: 'Lilita One',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    
        popup.add([background, warningText]);
    
        this.tweens.add({
            targets: popup,
            alpha: 0,
            duration: 2000,
            delay: 1500,
            onComplete: () => popup.destroy()
        });
    }
    

    cleanupReminder() {
        if (this.reminderBox?.active) {
            this.tweens.add({
                targets: [this.reminderBox, this.reminderText],
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.reminderBox.destroy();
                    this.reminderText.destroy();
                    this.reminderBox = null;
                    this.reminderText = null;
                }
            });
        }
    }

    update() {
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [PreloadScene, MainScene]
};

const game = new Phaser.Game(config);
