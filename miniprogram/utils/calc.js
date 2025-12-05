// utils/calc.js

/**
 * 计算复利
 * @param {Object} params 参数对象
 * @param {Number} params.principal 本金
 * @param {Number} params.fixedInvestment 定投金额
 * @param {String} params.fixedInvestmentType 定投类型：yearly/monthly
 * @param {Number} params.annualRate 年化收益率（小数形式，如0.05表示5%）
 * @param {Number} params.duration 历时
 * @param {String} params.durationType 历时类型：year/month/day
 * @param {String} params.compoundPeriod 复利计算周期：year/month/day/closed
 * @returns {Object} 计算结果
 */
function calculateCompoundInterest(params) {
  const {
    principal = 0,
    fixedInvestment = 0,
    fixedInvestmentType = 'monthly',
    annualRate = 0,
    duration = 0,
    durationType = 'month',
    compoundPeriod = 'month'
  } = params;

  // 如果所有输入都为0，返回零结果
  if (principal === 0 && fixedInvestment === 0) {
    return {
      totalInvestment: 0,
      finalAssets: 0,
      finalReturn: 0,
      totalReturnRate: 0,
      annualizedReturnRate: 0
    };
  }

  // 将历时统一转换为月数（便于计算）
  let totalMonths = 0;
  if (durationType === 'year') {
    totalMonths = duration * 12;
  } else if (durationType === 'month') {
    totalMonths = duration;
  } else {
    totalMonths = duration / 30; // 天数转月数
  }

  // 确定计算周期（统一使用月作为基础单位）
  let periodMonths = 1; // 默认按月计算
  if (compoundPeriod === 'year') {
    periodMonths = 12;
  } else if (compoundPeriod === 'month') {
    periodMonths = 1;
  } else if (compoundPeriod === 'day') {
    periodMonths = 1 / 30;
  } else { // closed - 封闭期，到期一次性计算
    periodMonths = totalMonths;
  }

  // 计算周期数
  const periods = periodMonths > 0 ? totalMonths / periodMonths : 0;
  // 封闭期特殊处理：使用年化收益率，历时为总年数
  let periodRate;
  let periodsForCalculation;
  if (compoundPeriod === 'closed') {
    periodRate = annualRate; // 封闭期使用年化收益率
    periodsForCalculation = totalMonths / 12; // 封闭期历时为总年数
  } else {
    periodRate = annualRate * (periodMonths / 12); // 每个周期的收益率
    periodsForCalculation = periods;
  }

  // 计算本金部分的复利
  let principalFinal = principal;
  if (principal > 0 && periodsForCalculation > 0 && periodRate > 0) {
    principalFinal = principal * Math.pow(1 + periodRate, periodsForCalculation);
  }

  // 计算定投部分的复利
  let fixedInvestmentFinal = 0;
  let totalInvestments = 0; // 定投总次数
  
  if (fixedInvestment > 0 && totalMonths > 0) {
    // 计算定投总次数
    if (fixedInvestmentType === 'yearly') {
      totalInvestments = Math.floor(totalMonths / 12);
    } else { // monthly
      totalInvestments = Math.floor(totalMonths);
    }

    // 计算定投的复利终值
    // 需要根据复利计算周期来正确计算每笔定投的复利
    // 使用逐笔计算方式，确保与时间序列生成逻辑一致
    
    if (compoundPeriod === 'closed') {
      // 封闭期：定投部分不产生复利，只计算本金（简单累加）
      fixedInvestmentFinal = fixedInvestment * totalInvestments;
    } else {
      // 非封闭期：逐笔计算每期定投的复利终值
      const isMonthly = fixedInvestmentType === 'monthly';
      const investmentInterval = isMonthly ? 1 : 12; // 定投间隔（月）
      
      // 计算每笔定投的复利终值
      for (let month = 1; month <= totalMonths; month++) {
        // 判断是否在这个月定投
        if (month % investmentInterval === 0) {
          // 计算这笔定投在剩余时间内产生的复利
          const remainingMonths = totalMonths - month;
          if (remainingMonths > 0) {
            // 计算剩余时间内的复利周期数
            const remainingPeriods = remainingMonths / periodMonths;
            if (remainingPeriods > 0 && periodRate > 0) {
              fixedInvestmentFinal += fixedInvestment * Math.pow(1 + periodRate, remainingPeriods);
            } else {
              fixedInvestmentFinal += fixedInvestment;
            }
          } else {
            // 最后一期定投，不产生复利
            fixedInvestmentFinal += fixedInvestment;
          }
        }
      }
    }
  }

  // 计算总投资额
  const totalInvestment = principal + fixedInvestment * totalInvestments;

  // 最终资产
  const finalAssets = principalFinal + fixedInvestmentFinal;

  // 最终收益
  const finalReturn = finalAssets - totalInvestment;

  // 总收益率 = 最终资产 / 总投资额 - 1
  const totalReturnRate = totalInvestment > 0 ? (finalAssets / totalInvestment - 1) : 0;

  // 年化收益率
  const years = totalMonths / 12;
  const annualizedReturnRate = years > 0 && totalInvestment > 0 ? 
    Math.pow(finalAssets / totalInvestment, 1 / years) - 1 : 0;

  return {
    totalInvestment,
    finalAssets,
    finalReturn,
    totalReturnRate,
    annualizedReturnRate: annualizedReturnRate > 0 ? annualizedReturnRate : 0
  };
}

/**
 * 生成时间序列数据（用于图表可视化）
 * @param {Object} params 参数对象（与 calculateCompoundInterest 相同）
 * @param {Number} params.principal 本金
 * @param {Number} params.fixedInvestment 定投金额
 * @param {String} params.fixedInvestmentType 定投类型：yearly/monthly
 * @param {Number} params.annualRate 年化收益率（小数形式，如0.05表示5%）
 * @param {Number} params.duration 历时
 * @param {String} params.durationType 历时类型：year/month/day
 * @param {String} params.compoundPeriod 复利计算周期：year/month/day/closed
 * @returns {Array} 时间序列数据数组，每个元素包含 { time, totalAssets, totalInvestment, totalReturn }
 */
function generateTimeSeriesData(params) {
  const {
    principal = 0,
    fixedInvestment = 0,
    fixedInvestmentType = 'monthly',
    annualRate = 0,
    duration = 0,
    durationType = 'month',
    compoundPeriod = 'month'
  } = params;

  // 如果所有输入都为0，返回空数组
  if (principal === 0 && fixedInvestment === 0) {
    return [];
  }

  // 将历时统一转换为月数
  let totalMonths = 0;
  if (durationType === 'year') {
    totalMonths = duration * 12;
  } else if (durationType === 'month') {
    totalMonths = duration;
  } else {
    totalMonths = duration / 30; // 天数转月数
  }

  // 确定计算周期
  let periodMonths = 1;
  if (compoundPeriod === 'year') {
    periodMonths = 12;
  } else if (compoundPeriod === 'month') {
    periodMonths = 1;
  } else if (compoundPeriod === 'day') {
    periodMonths = 1 / 30;
  } else { // closed
    periodMonths = totalMonths;
  }

  // 封闭期特殊处理：使用年化收益率，历时为总年数
  let periodRate;
  if (compoundPeriod === 'closed') {
    periodRate = annualRate; // 封闭期使用年化收益率
  } else {
    periodRate = annualRate * (periodMonths / 12); // 每个周期的收益率
  }
  const periods = periodMonths > 0 ? totalMonths / periodMonths : 0;

  // 生成时间序列数据点
  const dataPoints = [];
  
  // 初始状态（第0个月）
  let currentAssets = principal; // 当前资产
  let currentInvestment = principal; // 累计投入
  const initialPrincipal = principal; // 保存初始本金，用于封闭期计算
  dataPoints.push({
    time: 0,
    totalAssets: currentAssets,
    totalInvestment: currentInvestment,
    totalReturn: currentAssets - currentInvestment
  });

  // 如果总月数为0，只返回初始点
  if (totalMonths <= 0) {
    return dataPoints;
  }

  // 计算定投频率（每月或每年）
  const isMonthly = fixedInvestmentType === 'monthly';
  const investmentInterval = isMonthly ? 1 : 12; // 定投间隔（月）

  // 按月逐步计算，确保与 calculateCompoundInterest 的逻辑完全一致
  // 关键：使用与 calculateCompoundInterest 相同的计算方式
  // 对于每个月，使用与 calculateCompoundInterest 相同的公式计算当前资产
  for (let month = 1; month <= totalMonths; month++) {
    // 判断是否需要定投（在复利计算之前投入）
    if (fixedInvestment > 0 && month % investmentInterval === 0) {
      currentAssets += fixedInvestment;
      currentInvestment += fixedInvestment;
    }

    // 判断是否需要进行复利计算（根据复利计算周期）
    // 复利计算的逻辑必须与 calculateCompoundInterest 保持一致
    // 但图表显示的是"当前时间点的资产值"，而不是"未来终值"
    let shouldCompound = false;
    let compoundTimes = 1; // 这个月内需要复利的次数（按天复利时可能需要多次）
    
    if (compoundPeriod === 'closed') {
      // 封闭期，只在最后一个月计算
      shouldCompound = month === totalMonths;
    } else if (compoundPeriod === 'day') {
      // 按天复利：每个月需要计算30次复利（假设每月30天）
      const daysInMonth = 30;
      compoundTimes = daysInMonth;
      shouldCompound = periodRate > 0;
    } else {
      // 其他周期（年、月），判断是否到了复利计算点
      // 对于"年"周期，每12个月计算一次；对于"月"周期，每个月计算一次
      const periodsPassed = month / periodMonths;
      shouldCompound = Math.floor(periodsPassed) > Math.floor((month - 1) / periodMonths);
    }

    // 应用复利（在定投之后）
    // 注意：图表显示的是"当前时间点的资产值"，所以应该按实际复利计算，而不是计算未来终值
    if (shouldCompound && periodRate > 0) {
      if (compoundPeriod === 'closed') {
        // 封闭期：只对初始本金应用年化收益率，历时为总年数
        // 定投金额不产生复利，只累加本金
        const years = totalMonths / 12;
        const principalWithInterest = initialPrincipal * Math.pow(1 + periodRate, years);
        // 定投总额（不产生复利）
        const fixedInvestmentTotal = currentInvestment - initialPrincipal;
        currentAssets = principalWithInterest + fixedInvestmentTotal;
      } else if (compoundPeriod === 'day') {
        // 按天复利：这个月内每天计算一次复利
        // 使用复合公式：currentAssets * (1 + periodRate) ^ compoundTimes
        currentAssets = currentAssets * Math.pow(1 + periodRate, compoundTimes);
      } else {
        // 其他周期（年、月）：应用周期收益率
        // 对于"年"周期，每12个月计算一次复利
        // 对于"月"周期，每个月计算一次复利
        currentAssets = currentAssets * (1 + periodRate);
      }
    }

    // 记录数据点（每个月记录一次，或者根据数据量决定采样频率）
    // 如果总月数超过100，则每N个月记录一次以减少数据点
    const sampleInterval = totalMonths > 100 ? Math.ceil(totalMonths / 100) : 1;
    if (month % sampleInterval === 0 || month === totalMonths) {
      dataPoints.push({
        time: month,
        totalAssets: currentAssets,
        totalInvestment: currentInvestment,
        totalReturn: currentAssets - currentInvestment
      });
    }
  }

  return dataPoints;
}

/**
 * 生成年化收益率计算的时间序列数据（用于图表可视化）
 * @param {Object} params 参数对象
 * @param {Number} params.principal 本金
 * @param {Number} params.finalAmount 最终金额
 * @param {Number} params.duration 投资时长
 * @param {String} params.durationType 时长类型：year/month/day
 * @returns {Array} 时间序列数据数组，每个元素包含 { time, totalAssets, totalInvestment, totalReturn }
 */
function generateAnnualTimeSeriesData(params) {
  const {
    principal = 0,
    finalAmount = 0,
    duration = 0,
    durationType = 'year'
  } = params;

  // 如果输入无效，返回空数组
  if (principal <= 0 || finalAmount <= 0 || duration <= 0) {
    return [];
  }

  // 将时长统一转换为月数
  let totalMonths = 0;
  if (durationType === 'year') {
    totalMonths = duration * 12;
  } else if (durationType === 'month') {
    totalMonths = duration;
  } else {
    totalMonths = duration / 30; // 天数转月数
  }

  // 计算年化收益率
  const years = totalMonths / 12;
  let annualizedRate = 0;
  if (years > 0) {
    annualizedRate = Math.pow(finalAmount / principal, 1 / years) - 1;
  }

  // 生成时间序列数据点
  const dataPoints = [];
  
  // 初始状态（第0个月）
  dataPoints.push({
    time: 0,
    totalAssets: principal,
    totalInvestment: principal,
    totalReturn: 0
  });

  // 如果总月数为0，只返回初始点
  if (totalMonths <= 0) {
    return dataPoints;
  }

  // 按月计算资产增长
  const monthlyRate = annualizedRate / 12;
  
  // 如果总月数超过100，则每N个月记录一次以减少数据点
  const sampleInterval = totalMonths > 100 ? Math.ceil(totalMonths / 100) : 1;
  
  for (let month = 1; month <= totalMonths; month++) {
    // 计算当前资产（复利增长）
    const currentAssets = principal * Math.pow(1 + monthlyRate, month);
    const currentReturn = currentAssets - principal;
    
    // 记录数据点
    if (month % sampleInterval === 0 || month === totalMonths) {
      dataPoints.push({
        time: month,
        totalAssets: currentAssets,
        totalInvestment: principal,
        totalReturn: currentReturn
      });
    }
  }

  return dataPoints;
}

/**
 * 生成存钱计划的时间序列数据（用于图表可视化）
 * @param {Object} params 参数对象
 * @param {Number} params.currentDeposit 当前存款
 * @param {Number} params.targetDeposit 目标存款
 * @param {Number} params.expectedAnnualRate 预期年化收益率（小数形式，如0.035表示3.5%）
 * @param {Number} params.depositDuration 存款时长
 * @param {String} params.durationType 时长类型：year/month/day
 * @returns {Array} 时间序列数据数组，每个元素包含 { time, totalAssets, totalInvestment, totalReturn }
 */
function generateSavingsTimeSeriesData(params) {
  const {
    currentDeposit = 0,
    targetDeposit = 0,
    expectedAnnualRate = 0,
    depositDuration = 0,
    durationType = 'month'
  } = params;

  // 如果输入无效，返回空数组
  if (currentDeposit < 0 || targetDeposit <= 0 || depositDuration <= 0) {
    return [];
  }

  // 将存款时长统一转换为月数
  let totalMonths = 0;
  if (durationType === 'year') {
    totalMonths = depositDuration * 12;
  } else if (durationType === 'month') {
    totalMonths = depositDuration;
  } else {
    totalMonths = depositDuration / 30; // 天数转月数
  }

  // 计算每月需要存入的金额
  const monthlyRate = expectedAnnualRate / 12;
  const months = totalMonths;
  
  const futureValueOfCurrent = currentDeposit * Math.pow(1 + monthlyRate, months);
  const remainingNeeded = targetDeposit - futureValueOfCurrent;
  
  let monthlyDeposit = 0;
  if (remainingNeeded > 0) {
    const annuityFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    monthlyDeposit = remainingNeeded / annuityFactor;
  }

  // 生成时间序列数据点
  const dataPoints = [];
  
  // 初始状态（第0个月）
  dataPoints.push({
    time: 0,
    totalAssets: currentDeposit,
    totalInvestment: currentDeposit,
    totalReturn: 0
  });

  // 如果总月数为0，只返回初始点
  if (totalMonths <= 0) {
    return dataPoints;
  }

  // 按月逐步计算
  let currentAssets = currentDeposit;
  let currentInvestment = currentDeposit;
  
  // 如果总月数超过100，则每N个月记录一次以减少数据点
  const sampleInterval = totalMonths > 100 ? Math.ceil(totalMonths / 100) : 1;
  
  for (let month = 1; month <= totalMonths; month++) {
    // 每月存入
    if (monthlyDeposit > 0) {
      currentAssets += monthlyDeposit;
      currentInvestment += monthlyDeposit;
    }
    
    // 应用复利
    if (monthlyRate > 0) {
      currentAssets = currentAssets * (1 + monthlyRate);
    }
    
    // 记录数据点
    if (month % sampleInterval === 0 || month === totalMonths) {
      dataPoints.push({
        time: month,
        totalAssets: currentAssets,
        totalInvestment: currentInvestment,
        totalReturn: currentAssets - currentInvestment
      });
    }
  }

  return dataPoints;
}

module.exports = {
  calculateCompoundInterest,
  generateTimeSeriesData,
  generateAnnualTimeSeriesData,
  generateSavingsTimeSeriesData
};

