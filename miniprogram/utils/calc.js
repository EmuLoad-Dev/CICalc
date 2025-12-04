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
  const periodRate = annualRate * (periodMonths / 12); // 每个周期的收益率

  // 计算本金部分的复利
  let principalFinal = principal;
  if (principal > 0 && periods > 0 && periodRate > 0) {
    principalFinal = principal * Math.pow(1 + periodRate, periods);
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
    // 使用年金终值公式：FV = PMT * (((1+r)^n - 1) / r)
    // 其中 r 是每期的收益率，n 是定投次数
    if (fixedInvestmentType === 'yearly') {
      // 每年定投，使用年化收益率
      const yearlyRate = annualRate;
      if (yearlyRate > 0 && totalInvestments > 0) {
        const annuityFactor = (Math.pow(1 + yearlyRate, totalInvestments) - 1) / yearlyRate;
        fixedInvestmentFinal = fixedInvestment * annuityFactor;
      } else {
        fixedInvestmentFinal = fixedInvestment * totalInvestments;
      }
    } else { // monthly
      // 每月定投，使用月化收益率
      const monthlyRate = annualRate / 12;
      if (monthlyRate > 0 && totalInvestments > 0) {
        const annuityFactor = (Math.pow(1 + monthlyRate, totalInvestments) - 1) / monthlyRate;
        fixedInvestmentFinal = fixedInvestment * annuityFactor;
      } else {
        fixedInvestmentFinal = fixedInvestment * totalInvestments;
      }
    }
  }

  // 计算总投资额
  const totalInvestment = principal + fixedInvestment * totalInvestments;

  // 最终资产
  const finalAssets = principalFinal + fixedInvestmentFinal;

  // 最终收益
  const finalReturn = finalAssets - totalInvestment;

  // 总收益率
  const totalReturnRate = totalInvestment > 0 ? (finalReturn / totalInvestment) : 0;

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

  const periodRate = annualRate * (periodMonths / 12); // 每个周期的收益率
  const periods = periodMonths > 0 ? totalMonths / periodMonths : 0;

  // 生成时间序列数据点
  const dataPoints = [];
  
  // 初始状态（第0个月）
  let currentAssets = principal; // 当前资产
  let currentInvestment = principal; // 累计投入
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

  // 按月逐步计算
  for (let month = 1; month <= totalMonths; month++) {
    // 判断是否需要定投（在复利计算之前投入）
    if (fixedInvestment > 0 && month % investmentInterval === 0) {
      currentAssets += fixedInvestment;
      currentInvestment += fixedInvestment;
    }

    // 判断是否需要进行复利计算（根据复利周期）
    let shouldCompound = false;
    if (compoundPeriod === 'closed') {
      // 封闭期，只在最后一个月计算
      shouldCompound = month === totalMonths;
    } else {
      // 其他周期，判断是否到了复利计算点
      const periodsPassed = month / periodMonths;
      shouldCompound = Math.floor(periodsPassed) > Math.floor((month - 1) / periodMonths);
    }

    // 应用复利（在定投之后）
    if (shouldCompound && periodRate > 0) {
      currentAssets = currentAssets * (1 + periodRate);
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

module.exports = {
  calculateCompoundInterest,
  generateTimeSeriesData
};

