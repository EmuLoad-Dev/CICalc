// utils/templates.js
// 投资场景模板数据

// 计算收益页面模板
const calcTemplates = [
  {
    id: 'bank_deposit_1y',
    name: '银行定期1年',
    description: '银行1年期定期存款',
    icon: '🏦',
    type: 'calc',
    data: {
      principal: 100000,
      fixedInvestment: 0,
      fixedInvestmentType: 'monthly',
      annualRate: '1.5',
      duration: 1,
      durationType: 'year',
      compoundPeriod: 'year'
    }
  },
  {
    id: 'bank_deposit_3y',
    name: '银行定期3年',
    description: '银行3年期定期存款',
    icon: '🏦',
    type: 'calc',
    data: {
      principal: 100000,
      fixedInvestment: 0,
      fixedInvestmentType: 'monthly',
      annualRate: '2.5',
      duration: 3,
      durationType: 'year',
      compoundPeriod: 'year'
    }
  },
  {
    id: 'bank_deposit_5y',
    name: '银行定期5年',
    description: '银行5年期定期存款',
    icon: '🏦',
    type: 'calc',
    data: {
      principal: 100000,
      fixedInvestment: 0,
      fixedInvestmentType: 'monthly',
      annualRate: '3.0',
      duration: 5,
      durationType: 'year',
      compoundPeriod: 'year'
    }
  },
  {
    id: 'money_fund',
    name: '货币基金',
    description: '货币基金（余额宝等）',
    icon: '💰',
    type: 'calc',
    data: {
      principal: 50000,
      fixedInvestment: 2000,
      fixedInvestmentType: 'monthly',
      annualRate: '2.5',
      duration: 12,
      durationType: 'month',
      compoundPeriod: 'month'
    }
  },
  {
    id: 'bond_fund',
    name: '债券基金',
    description: '债券型基金',
    icon: '📈',
    type: 'calc',
    data: {
      principal: 50000,
      fixedInvestment: 2000,
      fixedInvestmentType: 'monthly',
      annualRate: '4.0',
      duration: 36,
      durationType: 'month',
      compoundPeriod: 'month'
    }
  },
  {
    id: 'stock_fund',
    name: '股票基金',
    description: '股票型基金（定投）',
    icon: '📊',
    type: 'calc',
    data: {
      principal: 10000,
      fixedInvestment: 1000,
      fixedInvestmentType: 'monthly',
      annualRate: '8.0',
      duration: 60,
      durationType: 'month',
      compoundPeriod: 'month'
    }
  },
  {
    id: 'mixed_fund',
    name: '混合基金',
    description: '混合型基金（定投）',
    icon: '📉',
    type: 'calc',
    data: {
      principal: 20000,
      fixedInvestment: 1500,
      fixedInvestmentType: 'monthly',
      annualRate: '6.0',
      duration: 36,
      durationType: 'month',
      compoundPeriod: 'month'
    }
  },
  {
    id: 'index_fund',
    name: '指数基金',
    description: '指数型基金（定投）',
    icon: '📈',
    type: 'calc',
    data: {
      principal: 10000,
      fixedInvestment: 1000,
      fixedInvestmentType: 'monthly',
      annualRate: '7.0',
      duration: 60,
      durationType: 'month',
      compoundPeriod: 'month'
    }
  },
  {
    id: 'p2p',
    name: 'P2P理财',
    description: 'P2P理财产品（高风险）',
    icon: '⚠️',
    type: 'calc',
    data: {
      principal: 50000,
      fixedInvestment: 0,
      fixedInvestmentType: 'monthly',
      annualRate: '10.0',
      duration: 12,
      durationType: 'month',
      compoundPeriod: 'month'
    }
  },
  {
    id: 'treasury_bond',
    name: '国债',
    description: '国债投资',
    icon: '🏛️',
    type: 'calc',
    data: {
      principal: 100000,
      fixedInvestment: 0,
      fixedInvestmentType: 'monthly',
      annualRate: '3.5',
      duration: 3,
      durationType: 'year',
      compoundPeriod: 'year'
    }
  }
];

// 存钱计划页面模板
const savingsTemplates = [
  {
    id: 'savings_bank',
    name: '银行储蓄',
    description: '通过银行储蓄达成目标',
    icon: '🏦',
    type: 'savings',
    data: {
      currentDeposit: 10000,
      targetDeposit: 200000,
      expectedAnnualRate: '2.0',
      depositDuration: 60,
      durationType: 'month'
    }
  },
  {
    id: 'savings_money_fund',
    name: '货币基金',
    description: '通过货币基金达成目标',
    icon: '💰',
    type: 'savings',
    data: {
      currentDeposit: 5000,
      targetDeposit: 100000,
      expectedAnnualRate: '2.5',
      depositDuration: 36,
      durationType: 'month'
    }
  },
  {
    id: 'savings_bond_fund',
    name: '债券基金',
    description: '通过债券基金达成目标',
    icon: '📈',
    type: 'savings',
    data: {
      currentDeposit: 20000,
      targetDeposit: 500000,
      expectedAnnualRate: '4.0',
      depositDuration: 60,
      durationType: 'month'
    }
  },
  {
    id: 'savings_stock_fund',
    name: '股票基金',
    description: '通过股票基金达成目标（定投）',
    icon: '📊',
    type: 'savings',
    data: {
      currentDeposit: 10000,
      targetDeposit: 300000,
      expectedAnnualRate: '8.0',
      depositDuration: 60,
      durationType: 'month'
    }
  },
  {
    id: 'savings_house',
    name: '购房首付',
    description: '为购房首付存钱',
    icon: '🏠',
    type: 'savings',
    data: {
      currentDeposit: 50000,
      targetDeposit: 500000,
      expectedAnnualRate: '3.5',
      depositDuration: 60,
      durationType: 'month'
    }
  },
  {
    id: 'savings_car',
    name: '购车计划',
    description: '为购车存钱',
    icon: '🚗',
    type: 'savings',
    data: {
      currentDeposit: 10000,
      targetDeposit: 200000,
      expectedAnnualRate: '3.0',
      depositDuration: 36,
      durationType: 'month'
    }
  },
  {
    id: 'savings_education',
    name: '教育基金',
    description: '为孩子教育存钱',
    icon: '🎓',
    type: 'savings',
    data: {
      currentDeposit: 20000,
      targetDeposit: 500000,
      expectedAnnualRate: '5.0',
      depositDuration: 120,
      durationType: 'month'
    }
  },
  {
    id: 'savings_retirement',
    name: '养老计划',
    description: '为退休养老存钱',
    icon: '👴',
    type: 'savings',
    data: {
      currentDeposit: 50000,
      targetDeposit: 1000000,
      expectedAnnualRate: '6.0',
      depositDuration: 240,
      durationType: 'month'
    }
  }
];

// 计算年化页面模板（较少，因为这是反推计算）
const annualTemplates = [
  {
    id: 'annual_bank',
    name: '银行定期',
    description: '银行定期存款收益',
    icon: '🏦',
    type: 'annual',
    data: {
      principal: 100000,
      finalAmount: 107500,
      duration: 3,
      durationType: 'year'
    }
  },
  {
    id: 'annual_fund',
    name: '基金投资',
    description: '基金投资收益',
    icon: '📈',
    type: 'annual',
    data: {
      principal: 50000,
      finalAmount: 60000,
      duration: 2,
      durationType: 'year'
    }
  },
  {
    id: 'annual_stock',
    name: '股票投资',
    description: '股票投资收益',
    icon: '📊',
    type: 'annual',
    data: {
      principal: 100000,
      finalAmount: 150000,
      duration: 3,
      durationType: 'year'
    }
  }
];

// 获取指定类型的模板列表
function getTemplates(type) {
  switch (type) {
    case 'calc':
      return calcTemplates;
    case 'savings':
      return savingsTemplates;
    case 'annual':
      return annualTemplates;
    default:
      return [];
  }
}

// 根据ID获取模板
function getTemplateById(type, id) {
  const templates = getTemplates(type);
  return templates.find(t => t.id === id) || null;
}

// 获取用户自定义模板（从本地存储）
function getCustomTemplates(type) {
  try {
    const key = `custom_templates_${type}`;
    const customTemplates = wx.getStorageSync(key) || [];
    return customTemplates;
  } catch (e) {
    console.error('获取自定义模板失败:', e);
    return [];
  }
}

// 保存用户自定义模板
function saveCustomTemplate(type, template) {
  try {
    const key = `custom_templates_${type}`;
    let customTemplates = wx.getStorageSync(key) || [];
    
    // 检查是否已存在（根据ID）
    const existingIndex = customTemplates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      customTemplates[existingIndex] = template;
    } else {
      customTemplates.push(template);
    }
    
    // 限制自定义模板数量，最多保存20个
    if (customTemplates.length > 20) {
      customTemplates = customTemplates.slice(0, 20);
    }
    
    wx.setStorageSync(key, customTemplates);
    return true;
  } catch (e) {
    console.error('保存自定义模板失败:', e);
    return false;
  }
}

// 删除用户自定义模板
function deleteCustomTemplate(type, templateId) {
  try {
    const key = `custom_templates_${type}`;
    let customTemplates = wx.getStorageSync(key) || [];
    customTemplates = customTemplates.filter(t => t.id !== templateId);
    wx.setStorageSync(key, customTemplates);
    return true;
  } catch (e) {
    console.error('删除自定义模板失败:', e);
    return false;
  }
}

module.exports = {
  getTemplates,
  getTemplateById,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate
};

