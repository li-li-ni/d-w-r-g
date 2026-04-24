// 逻辑斯蒂函数
function logistic(x) {
    return 1 / (1 + Math.exp(-x));
}

// 逻辑斯蒂函数的反函数
function inverseLogistic(p) {
    // 避免除以零或取对数为负数的情况
    if (p <= 0) return -10;
    if (p >= 1) return 10;
    return Math.log(p / (1 - p));
}

// 根据选择的组排情况动态生成输入字段
function updateInputFields() {
    const composition = document.getElementById('team-composition').value;
    const survivorInputs = document.getElementById('survivor-inputs');
    survivorInputs.innerHTML = '';
    
    if (!composition) return;
    
    survivorInputs.innerHTML = '<label>求生者各组胜率 (%)</label>';
    
    switch (composition) {
        case 'four-solo':
            addInputField(survivorInputs, '单排一');
            addInputField(survivorInputs, '单排二');
            addInputField(survivorInputs, '单排三');
            addInputField(survivorInputs, '单排四');
            break;
        case 'one-duo-two-solo':
            addInputField(survivorInputs, '双排');
            addInputField(survivorInputs, '单排一');
            addInputField(survivorInputs, '单排二');
            break;
        case 'one-trio-one-solo':
            addInputField(survivorInputs, '三排');
            addInputField(survivorInputs, '单排');
            break;
        case 'two-duo':
            addInputField(survivorInputs, '双排一');
            addInputField(survivorInputs, '双排二');
            break;
        case 'one-four':
            addInputField(survivorInputs, '四排');
            break;
    }
}

// 添加输入字段
function addInputField(container, label) {
    const div = document.createElement('div');
    div.className = 'group-input';
    div.innerHTML = `
        <label>${label}胜率:</label>
        <input type="number" class="survivor-winrate" min="0" max="100" step="0.1" placeholder="例如：50.0">
    `;
    container.appendChild(div);
}

// 开发者模式切换事件
document.getElementById('developer-mode').addEventListener('change', function() {
    const developerOptions = document.getElementById('developer-options');
    if (this.checked) {
        developerOptions.style.display = 'block';
    } else {
        developerOptions.style.display = 'none';
    }
});

// 恢复默认设置
function resetDefaults() {
    // 恢复监管者平均胜率
    document.getElementById('hunter-avg-winrate').value = 60;
    // 恢复权重设置
    document.getElementById('duo-weight').value = 1;
    document.getElementById('trio-weight').value = 1;
    document.getElementById('four-weight').value = 1;
    // 恢复elo补偿
    document.getElementById('elo-compensation').value = 0;
    // 显示提示
    alert('已恢复默认设置');
}

// 切换更新日志显示状态
function toggleChangelog() {
    const changelog = document.getElementById('changelog');
    if (changelog.style.display === 'none') {
        changelog.style.display = 'block';
    } else {
        changelog.style.display = 'none';
    }
}

// 计算胜率
function calculateWinrate() {
    const composition = document.getElementById('team-composition').value;
    const hunterWinrate = parseFloat(document.getElementById('hunter-winrate').value) / 100;
    
    // 验证输入
    if (!composition) {
        alert('请选择求生者组排情况');
        return;
    }
    
    if (isNaN(hunterWinrate) || hunterWinrate < 0 || hunterWinrate > 1) {
        alert('请输入有效的监管者胜率');
        return;
    }
    
    // 获取所有求生者胜率输入
    const survivorWinrateInputs = document.querySelectorAll('.survivor-winrate');
    const survivorWinrates = [];
    
    for (const input of survivorWinrateInputs) {
        const winrate = parseFloat(input.value) / 100;
        if (isNaN(winrate) || winrate < 0 || winrate > 1) {
            alert('请输入有效的求生者胜率');
            return;
        }
        survivorWinrates.push(winrate);
    }
    
    // 获取权重值
    let duoWeight = 1;
    let trioWeight = 1;
    let fourWeight = 1;
    const developerMode = document.getElementById('developer-mode').checked;
    if (developerMode) {
        const duoWeightInput = parseFloat(document.getElementById('duo-weight').value);
        const trioWeightInput = parseFloat(document.getElementById('trio-weight').value);
        const fourWeightInput = parseFloat(document.getElementById('four-weight').value);
        
        if (!isNaN(duoWeightInput) && duoWeightInput >= 1 && duoWeightInput <= 2) {
            duoWeight = duoWeightInput;
        }
        if (!isNaN(trioWeightInput) && trioWeightInput >= 1 && trioWeightInput <= 3) {
            trioWeight = trioWeightInput;
        }
        if (!isNaN(fourWeightInput) && fourWeightInput >= 1 && fourWeightInput <= 4) {
            fourWeight = fourWeightInput;
        }
    }
    
    // 计算监管者的elo分数
    const hunterX = inverseLogistic(hunterWinrate);
    
    // 计算求生者的elo分数总和和总权重
    let survivorTotalElo = 0;
    let totalWeight = 0;
    
    // 根据组排情况计算每一组的权重和elo分数
    switch (composition) {
        case 'four-solo':
            // 四个单排，权重都为1
            for (const winrate of survivorWinrates) {
                const survivorX = inverseLogistic(winrate);
                survivorTotalElo += survivorX * 1; // 单排权重为1
                totalWeight += 1;
            }
            break;
        case 'one-duo-two-solo':
            // 一组双排，两组单排
            const duoWinrate = survivorWinrates[0];
            const soloWinrate1 = survivorWinrates[1];
            const soloWinrate2 = survivorWinrates[2];
            
            survivorTotalElo += inverseLogistic(duoWinrate) * duoWeight;
            survivorTotalElo += inverseLogistic(soloWinrate1) * 1;
            survivorTotalElo += inverseLogistic(soloWinrate2) * 1;
            
            totalWeight += duoWeight + 1 + 1;
            break;
        case 'one-trio-one-solo':
            // 一组三排，一组单排
            const trioWinrate = survivorWinrates[0];
            const soloWinrate = survivorWinrates[1];
            
            survivorTotalElo += inverseLogistic(trioWinrate) * trioWeight;
            survivorTotalElo += inverseLogistic(soloWinrate) * 1;
            
            totalWeight += trioWeight + 1;
            break;
        case 'two-duo':
            // 两组双排
            const duoWinrate1 = survivorWinrates[0];
            const duoWinrate2 = survivorWinrates[1];
            
            survivorTotalElo += inverseLogistic(duoWinrate1) * duoWeight;
            survivorTotalElo += inverseLogistic(duoWinrate2) * duoWeight;
            
            totalWeight += duoWeight * 2;
            break;
        case 'one-four':
            // 一组四排
            const fourWinrate = survivorWinrates[0];
            survivorTotalElo += inverseLogistic(fourWinrate) * fourWeight;
            totalWeight += fourWeight;
            break;
    }
    
    // 计算调整因子
    let adjustmentFactor = 0.405; // 默认值，对应60%胜率
    if (developerMode) {
        const hunterAvgWinrate = parseFloat(document.getElementById('hunter-avg-winrate').value) / 100;
        if (!isNaN(hunterAvgWinrate) && hunterAvgWinrate > 0 && hunterAvgWinrate < 1) {
            adjustmentFactor = inverseLogistic(hunterAvgWinrate);
        }
    }
    
    // 获取兜底elo分数补偿
    let eloCompensation = 0;
    if (developerMode) {
        const compensationInput = parseFloat(document.getElementById('elo-compensation').value);
        if (!isNaN(compensationInput)) {
            eloCompensation = compensationInput;
        }
    }
    
    // 给监管者的分数减去总权重倍的调整因子，再加上兜底补偿
    const hunterTrueElo = hunterX - totalWeight * adjustmentFactor + eloCompensation;
    
    // 计算监管者真实elo分数与求生者elo分数的差值
    const newDiff = hunterTrueElo - survivorTotalElo;
    const newX = newDiff;
    
    // 计算预测的监管者胜率
    const predictedHunterWinrate = logistic(newX) * 100;
    const predictedSurvivorWinrate = 100 - predictedHunterWinrate;
    
    // 显示结果
    document.getElementById('predicted-hunter-winrate').textContent = predictedHunterWinrate.toFixed(2);
    document.getElementById('predicted-survivor-winrate').textContent = predictedSurvivorWinrate.toFixed(2);
    document.getElementById('result').style.display = 'block';
}