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
let coinText;

const payouts = {
    symbol1: 10,
    symbol2: 15,
    symbol3: 20,
    symbol4: 25,
    symbol5: 30,
    symbol6: 50,
    symbol7: 75,
    symbol8: 100
};

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
}
function create() {
    this.add.image(400, 300, 'background').setDisplaySize(800, 600);

    const reelWidth = 140; 
    const totalReelWidth = reelCount * reelWidth; 
    const totalReelHeight = symbolCount * symbolHeight;
    
    const startX = (800 - totalReelWidth) / 2 + reelWidth / 2; 
    const startY = 200

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
        this.sound.play('buttonPress'); 
        startSpin(this);
    });

    coinText = this.add.text(142, 530, `${'Coins:' + coins}`, { fontSize: '20px', fill: '#fff', fontFamily: 'Arial', fontStyle: 'bold' });
    coinText.setAngle(4)
}



function startSpin(scene) {
    if (isSpinning || coins <= 0) return; 
    isSpinning = true;


    coins -= 10; 
    updateCoinText();

    let reelsFinished = 0; 

    reels.forEach((reel, index) => {
        const delay = index * reelStopDelay; 
        spinReel(scene, reel, index, () => {
            reelsFinished++;
            if (reelsFinished === reelCount) {
                isSpinning = false;
                calculatePayout();
            }
        });
    });
}

function spinReel(scene, reel, index, onComplete) {
    const spinCycles = 5; 
    const spinDurationPerCycle = spinDuration / spinCycles; 


    const spinTween = scene.tweens.addCounter({
        from: 0,
        to: symbolHeight * spinCycles * symbolCount, 
        duration: spinDuration + index * reelStopDelay, 
        ease: 'Cubic.easeInOut', 
        onUpdate: (tween) => {
            const value = tween.getValue();
            reel.forEach((symbol) => {

                symbol.y = - 100 - (symbol.y / (symbolHeight ) );
            });
        },
        onComplete: () => {
            reel.forEach((symbol, positionIndex) => {
                const randomSymbol = Phaser.Math.Between(1, 8); 
                symbol.setTexture(`symbol${randomSymbol}`); 
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
}

function calculatePayout() {
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
            const winningSymbol = baseSymbol;
            const basePayout = payouts[winningSymbol] || 0;

            coins += basePayout;
            console.log(
                `You Win on Payline ${lineIndex + 1}! Symbol: ${winningSymbol}, Payout: ${basePayout}`
            );
        }
    });

    updateCoinText();
}

function update() {
}