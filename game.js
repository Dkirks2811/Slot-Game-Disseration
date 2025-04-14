const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


const game = new Phaser.Game(config);

const reelCount = 4;
const symbolCount = 3; 
const spinDuration = 400; 
const symbolHeight = 100; 
const reelStopDelay = 300; 

let reels = [];
let isSpinning = false;
let spinButton;
let coins = 1000; 
let coinBefore = 0;
let coinText;
let betAmount = 10;
let isInBonusMode = false;
let bonusTriggered = false;
let bonusSymbolCount = 0;
let freeSpinsText;
let reminderBox;
let reminderText;
let sessionStartCoins = coins;
let profitLossText;


let freeSpinsLeft = 0;
let goldGlow;

let bonusAchieved = false; 

function getPayouts() {
    return {
        symbol1: betAmount,
        symbol2: betAmount * 1.5,
        symbol3: betAmount * 2,
        symbol4: betAmount * 2.5,
        symbol5: betAmount * 3,
        symbol6: betAmount * 5,
        symbol7: betAmount * 7.5,
        symbol8: betAmount * 10
    };
}

const paylines = [
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

function preload() {
    for (let i = 1; i <= 8; i++) {
        this.load.image(`symbol${i}`, `./img${i}.png`);
    }
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

function create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);

    const reelWidth = 140; 
    const totalReelWidth = reelCount * reelWidth; 
    const totalReelHeight = symbolCount * symbolHeight;
    
    const startX = (800 - totalReelWidth) / 2 + reelWidth / 2; 
    const startY = 200;

    for (let i = 0; i < reelCount; i++) {
        let reel = [];
        for (let j = 0; j < symbolCount; j++) {
            let randomSymbol = Phaser.Math.Between(1, 8);
            let symbol = this.add.sprite(startX + i * reelWidth, startY + j  * symbolHeight, `symbol${randomSymbol}`);

            symbol.setScale(symbolHeight / 450); 
            reel.push(symbol);
        }
        reels.push(reel);
    }

    spinButton = this.add.sprite(400, startY + totalReelHeight + 50, 'spinButton').setInteractive();
    spinButton.setScale(1.25);
    spinButton.on('pointerdown', () => {

        if (reminderText && reminderText.active) {
            reminderText.destroy();
            reminderBox.destroy();
        }

        this.sound.play('buttonPress'); 
        spinButton.setScale(1.1); 
        this.tweens.add({
            targets: spinButton,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 150,
            ease: 'Bounce.easeOut',
        });
        startSpin(this);
    });

const maxBet = 50;        

const minusButton = this.add.text(670, 548, '-', {

    fontSize: '32px',
    backgroundColor: '#346564',
    color: '#fff',
    fontFamily: 'Lilita One',
    padding: { x: 15, y: 10 },
    align: 'center',
}).setOrigin(0.5).setInteractive().setDepth(10);
minusButton.setScale(0.8);

const plusButton = this.add.text(530, 548, '+', {
    fontSize: '32px',
    backgroundColor: '#346564',
    color: '#fff',
    fontFamily: 'Lilita One',
    padding: { x: 15, y: 10 },
    align: 'center',
}).setOrigin(0.5).setInteractive().setDepth(10);
plusButton.setScale(0.8);

const betText = this.add.text(600, 548, `${betAmount} coins`, {
    fontSize: '22px',
    fill: '#fff',
    fontFamily: 'Lilita One',
    stroke: '#000',
    strokeThickness: 3,
}).setOrigin(0.5).setDepth(10);

function updateBetDisplay() {
    betText.setText(`${betAmount} coins`);

    plusButton.setAlpha(betAmount >= maxBet ? 0.5 : 1).disableInteractive();
    minusButton.setAlpha(betAmount <= 1 ? 0.5 : 1).disableInteractive();

    if (betAmount < maxBet) plusButton.setInteractive();
    if (betAmount > 1) minusButton.setInteractive();
}

minusButton.on('pointerdown', () => {
    if (betAmount > 1) {
        betAmount--;
        updateBetDisplay();
        this.sound.play('buttonPress');
    }
});

plusButton.on('pointerdown', () => {
    if (betAmount < maxBet) {
        betAmount++;
        updateBetDisplay();
        this.sound.play('buttonPress');
    }
});

updateBetDisplay();


    coinText = this.add.text(142, 527, `${'Coins:' + coins}`, { fontSize: '22px', fill: '#fff', fontFamily: 'Lilita One', stroke: '#000', strokeThickness: 3,});
    coinText.setAngle(4);

    profitLossText = this.add.text(20, 10, 'Profit/Loss: 0', {
        fontSize: '20px',
        fill: '#ff3333', 
        fontFamily: 'Lilita One',
        stroke: '#000',
        strokeThickness: 3
    });


    goldGlow = this.add.image(400, 300, 'goldGlow').setDisplaySize(800, 600);
    goldGlow.setDepth(20);
    goldGlow.setVisible(false);

    freeSpinsText = this.add.text(650, 50, '', {
        fontSize: '22px',
        fill: '#fff',
        fontFamily: 'Lilita One',
        stroke: '#000',
        strokeThickness: 3,
    }).setVisible(false);

    this.time.addEvent({
        delay: 300000,
        loop: true,
        callback: () => {
            if (reminderBox && reminderBox.active) return;
    
            reminderBox = this.add.rectangle(400, 300, 400, 100, 0x000000, 0.7)
                .setOrigin(0.5)
                .setDepth(25)
                .setScale(0);
    
            reminderText = this.add.text(400, 300, 'Reminder: Take a break!', {
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
                targets: [reminderBox, reminderText],
                scaleX: 1,
                scaleY: 1,
                duration: 400,
                ease: 'Back.easeOut',
            });
        }
    });
    
    

}

function startSpin(scene) {
    if (isSpinning || coins <= 0 || (isInBonusMode && freeSpinsLeft <= 0)) return;
    isSpinning = true;

    if (bonusAchieved) {
        startBonusMode(scene);
        bonusAchieved = false; 
    }

    if (!isInBonusMode) {
        coins -= betAmount;
        coinBefore = coins
    }
    updateCoinText();

    let reelsFinished = 0;

    reels.forEach((reel, index) => {
        const delay = index * reelStopDelay;
        const spinSpeed = isInBonusMode ? spinDuration * 1.5 : spinDuration; 

        spinReel(scene, reel, index, spinSpeed, () => {
            reelsFinished++;
            if (reelsFinished === reelCount) {
                isSpinning = false;
                calculatePayout(scene);

                if (isInBonusMode) {
                    freeSpinsText.setText(`Free Spins: ${freeSpinsLeft}`);

                    if (freeSpinsLeft === 1) {
                        endBonusMode(scene); 
                    }

                    freeSpinsLeft--; 
                }
            }
        });
    });
}

function spinReel(scene, reel, index, spinSpeed, onComplete) {
    const spinCycles = isInBonusMode ? 8 : 5; 
    const spinDurationPerCycle = spinSpeed / spinCycles;

    const spinTween = scene.tweens.addCounter({
        from: 0,
        to: symbolHeight * spinCycles * symbolCount,
        duration: spinSpeed + index * reelStopDelay,
        ease: 'Cubic.easeInOut',
        onUpdate: (tween) => {
            const value = tween.getValue();
            reel.forEach((symbol) => {
                symbol.y = -100 - (symbol.y / (symbolHeight));
            });
        },
        onComplete: () => {
            reel.forEach((symbol, positionIndex) => {
                const randomSymbol = Phaser.Math.Between(1, 8);
                const isBonus = !isInBonusMode && Phaser.Math.Between(1, 250) === 2;
                symbol.setTexture(isBonus ? 'bonusSymbol' : `symbol${randomSymbol}`);

                if (isBonus) {
                    bonusSymbolCount++;
                    
                    scene.sound.play('suspenseSound');

                    if (bonusSymbolCount >= 2) {
                        bonusAchieved = true;
                    }
                }
            });

            reel.forEach((symbol, positionIndex) => {
                const finalY = 200 + positionIndex * symbolHeight;
                scene.tweens.add({
                    targets: symbol,
                    y: finalY,
                    duration: 200,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        scene.sound.play('reelStop');
                        if (positionIndex === reel.length - 1) {
                            if (onComplete) onComplete();
                        }
                    }
                });
            });
        }
    });
}



function updateCoinText() {
    coinText.setText(`Coins: ${coins}`);

    let net = coins - sessionStartCoins;
    let displayValue = net >= 0 ? `+${net}` : `${net}`;
    profitLossText.setText(`Profit/Loss: ${displayValue}`);

}

function showWinPopup(scene, amount) {
    let winText = scene.add.text(400, 100, `+${amount} Coins!`, {
        fontSize: '32px',
        fontFamily: 'Lilita One',
        fill: '#ffde59',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(10);

    scene.tweens.add({
        targets: winText,
        y: 50, 
        alpha: 0, 
        duration: 2000,
        ease: 'Power1',
        onComplete: () => winText.destroy()
    });
}

function showBonusPopup(scene) {
    let bonusText = scene.add.text(400, 100, `Bonus Achieved!`, {
        fontSize: '32px',
        fontFamily: 'Lilita One',
        fill: '#ffde59',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(10);

    scene.tweens.add({
        targets: bonusText,
        y: 50, 
        alpha: 0, 
        duration: 2000,
        ease: 'Power1',
        onComplete: () => bonusText.destroy()
    });
}

function showBigWinPopup(scene, amount) {
    let bigWinContainer = scene.add.container(400, 300).setDepth(15);

    let background = scene.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRect(-200, -100, 400, 200);
    background.setAlpha(0);

    let winText = scene.add.text(0, 0, `BIG WIN!\n+${amount} Coins!`, {
        fontSize: '48px',
        fontFamily: 'Lilita One',
        fill: '#ffde59',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);

    bigWinContainer.add([background, winText]);

    scene.tweens.add({
        targets: background,
        alpha: 1,
        duration: 2000
    });

    scene.tweens.add({
        targets: winText,
        scaleX: 1.2,
        scaleY: 1.2,
        yoyo: true,
        repeat: 3,
        duration: 2000
    });

    scene.time.delayedCall(2000, () => {
        bigWinContainer.destroy();
    });
}

function calculatePayout(scene) {
    let won = false;
    let totalWin = 0;
    let isBigWin = false;

    const bigWinThreshold = betAmount * 6; 

    bonusSymbolCount = 0;
    paylines.forEach((line, lineIndex) => {
        const lineSymbols = line.map((row, reelIndex) => {
            if (row === -1) return null;
            return reels[reelIndex][row - 1].texture.key;
        });

        const baseSymbol = lineSymbols.find((symbol) => symbol !== null);
        const allMatch = lineSymbols.every(
            (symbol) => symbol === null || symbol === baseSymbol
        );

        if (allMatch && baseSymbol) {
            let payouts = getPayouts();
            let payout = payouts[baseSymbol] || 0;
            
            if (isInBonusMode) payout *= 10;

            coins += payout;
            totalWin += payout;
            won = true;

            if (totalWin >= bigWinThreshold) {
                isBigWin = true;
            }
        }
    });

    updateCoinText();

    if (won) {
        if (isBigWin) {
            scene.sound.play('bigWin');
            showBigWinPopup(scene, totalWin);
        } else {
            scene.sound.play('winSound');
            showWinPopup(scene, totalWin);
        }
    }

    if (bonusAchieved) {
        scene.sound.play('bonusStart');
        showBonusPopup(scene);
    }

    if (isInBonusMode && freeSpinsLeft >= 0) {
        scene.time.delayedCall(1500, () => startSpin(scene)); 
    }
}


function startBonusMode(scene) {
    bonusTriggered = true;
    isInBonusMode = true;
    freeSpinsLeft = 8;

    goldGlow.setVisible(true);
    scene.tweens.add({
        targets: goldGlow,
        alpha: 0.2, 
        duration: 1000,
        ease: 'Linear'
    });

    freeSpinsText.setVisible(true).setText(`Free Spins: ${freeSpinsLeft}`);
}


function showBonusEndPopup(scene, totalBonusWin) {
    let bonusWinContainer = scene.add.container(400, 300).setDepth(20);

    let background = scene.add.graphics();
    background.fillStyle(0x000000, 0.8);
    background.fillRect(-250, -125, 500, 250);
    background.setAlpha(1);

    let winText = scene.add.text(0, -20, `BONUS COMPLETE!\nTotal Win: ${totalBonusWin} Coins!`, {
        fontSize: '36px',
        fontFamily: 'Lilita One',
        fill: '#ffde59',
        stroke: '#000',
        strokeThickness: 6,
        align: 'center'
    }).setOrigin(0.5);

    let continueText = scene.add.text(0, 80, `Click Spin to Continue`, {
        fontSize: '24px',
        fontFamily: 'Lilita One',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4,
        align: 'center'
    }).setOrigin(0.5);
    
    bonusWinContainer.add([background, winText, continueText]);

    isSpinning = true;

    for (let i = 0; i < 50; i++) {
        let confetti = scene.add.rectangle(
            Phaser.Math.Between(100, 700),
            Phaser.Math.Between(-50, 100),
            6, 12,
            Phaser.Display.Color.RandomRGB().color
        );
        confetti.setRotation(Phaser.Math.FloatBetween(-0.5, 0.5));

        scene.tweens.add({
            targets: confetti,
            y: 650,
            x: confetti.x + Phaser.Math.Between(-100, 100),
            angle: Phaser.Math.Between(0, 360),
            duration: Phaser.Math.Between(2000, 4000),
            ease: 'Linear',
            onComplete: () => confetti.destroy()
        });
    }

    spinButton.once('pointerdown', () => {
        bonusWinContainer.destroy();
        isSpinning = false;
    });
}

function endBonusMode(scene) {
    isInBonusMode = false;
    goldGlow.setVisible(false);
    bonusTriggered = false;
    freeSpinsText.setVisible(false);

    let totalBonusWin = coins - coinBefore; 
    showBonusEndPopup(scene, totalBonusWin);
}


function update() {
}