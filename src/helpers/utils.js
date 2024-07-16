// import sanitizeHtml from 'sanitize-html';
import slug from 'slug';
import times from 'lodash/times.js';
import _get from 'lodash/get.js';
import moment from 'moment';
import dateFormat from 'dateformat';
import { customAlphabet } from 'nanoid';

// import reportService from '../capp/services/reportService';
// import supplierService from '../capp/services/supplierService';
// import addressService from '../capp/services/addressService';
import config from '../config.js';
import { db, Op } from '../models/index.js';

const utils = {};

utils.slugify = val => {
  if (val === null) {
    return null;
  }
  return (
    slug(val, {
      lower: true,
      remove: null,
    }) || val
  );
};

utils.copyKeys = (obj, keys) => {
  const ret = {};
  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      ret[key] = obj[key];
    }
  });
  return ret;
};

utils.hasKeys = (obj, keys) => {
  let valid = true;
  keys.forEach(key => {
    if (!(key in obj)) {
      valid = false;
    }
  });
  return valid;
};

utils.paginate = (page, limit) => {
  let queryLimit = 20;
  let queryOffset = 0;
  if (limit && limit > 0 && limit < 20) {
    queryLimit = limit;
  }
  if (page && page > 1) {
    queryOffset = (page - 1) * queryLimit;
  }
  return {
    limit: queryLimit,
    offset: queryOffset,
  };
};

utils.generateRandomString = n => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  times(n, () => {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  });
  return text;
};

utils.generateRandomNumber = n => {
  let text = '';
  const possible = '0123456789';
  times(n, () => {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  });
  return text;
};

utils.maskData = str => str.replace(/^[\w\W]{1,6}/, '******');

utils.getShortDate = timestamp => {
  let date = new Date();
  if (timestamp) {
    date = new Date(timestamp);
  }
  return date.toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

utils.getDateGoodDataFormat = timestamp => {
  let date = new Date();
  if (timestamp) {
    date = new Date(timestamp);
  }
  return date.toISOString().slice(0, 10);
};

utils.getMonthFromString = month => {
  const d = Date.parse(`${month}1, 2020`);
  return new Date(d).getMonth() + 1;
};

utils.getShortYear = timestamp => {
  let date = new Date();
  if (timestamp) {
    date = new Date(timestamp);
  }
  return date.toLocaleString('en-us', { year: 'numeric' }).substring(2);
};

utils.getCurrentFinancialYear = () => {
  const today = new Date();
  let currenctYear = new Date();
  currenctYear = currenctYear
    .toLocaleString('en-us', { year: 'numeric' })
    .substring(2);
  if (today.getMonth() + 1 <= 3) {
    let previousYear = new Date(
      new Date().setFullYear(new Date().getFullYear() - 1),
    );
    previousYear = previousYear
      .toLocaleString('en-us', { year: 'numeric' })
      .substring(2);
    return `${previousYear}-${currenctYear}`;
  }
  let nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
  nextYear = nextYear.toLocaleString('en-us', { year: 'numeric' }).substring(2);
  return `${currenctYear}-${nextYear}`;
};

utils.roundTo = (value, digits = 0) => {
  const multiplicator = 10 ** digits;
  const tmp = parseFloat((value * multiplicator).toFixed(5));
  const ret = Math.round(tmp) / multiplicator;
  return +ret.toFixed(digits);
};

utils.getRoleIdsByCurrentApproval = approvalUsers => {
  const roleIds = approvalUsers.map(u => u.roleId);
  return [...new Set(roleIds)];
};

// eslint-disable-next-line no-restricted-globals
utils.isNumeric = n => !isNaN(parseFloat(n)) && isFinite(n);

utils.getFutureDate = (initial, value, type) => {
  const date = new Date(initial);
  if (type === 'minutes') {
    date.setMinutes(date.getMinutes() + +value);
  } else if (type === 'hours') {
    date.setHours(date.getHours() + +value);
  } else if (type === 'days') {
    date.setDate(date.getDate() + +value);
  } else if (type === 'months') {
    date.setMonth(date.getMonth() + +value);
  }
  return date;
};

utils.sorters = {
  byPrice: (a, b) => a.price - b.price,
  byPriceInBaseCurrency: (a, b) => a.priceInBaseCurrency - b.priceInBaseCurrency,
  bypriceNormalisedInBaseCurrency: (a, b) => a.priceNormalisedInBaseCurrency - b.priceNormalisedInBaseCurrency,
  byPriceReverse: (a, b) => b.price - a.price,
  byValue: (a, b) => a.value - b.value,
  byValueReverse: (a, b) => b.value - a.value,
  byPriceAndUpdatedTime: (a, b) => {
    if (a.price === b.price) {
      return a.updatedTime - b.updatedTime;
    }
    return a.price - b.price;
  },
  byPriceInBaseCurrencyAndUpdatedTime: (a, b) => {
    if (a.priceInBaseCurrency === b.priceInBaseCurrency) {
      return a.updatedTime - b.updatedTime;
    }
    return a.priceInBaseCurrency - b.priceInBaseCurrency;
  },
  byPriceInBaseCurrencyAndNormalisedCurrencyAndLeadTimeAndIncumBentSupplier: (
    a,
    b,
  ) => {
    if (a.priceInBaseCurrency === b.priceInBaseCurrency) {
      if (a.priceNormalisedInBaseCurrency === b.priceNormalisedInBaseCurrency) {
        if (a.leadTime === b.leadTime) {
          return a.incumbentSupplier - b.incumbentSupplier;
        }
        return b.leadTime - a.leadTime;
      }
      return a.priceNormalisedInBaseCurrency - b.priceNormalisedInBaseCurrency;
    }
    return a.priceInBaseCurrency - b.priceInBaseCurrency;
  },
  byPriceAndUpdatedTimeReverse: (a, b) => {
    if (b.price === a.price) {
      return b.updatedTime - a.updatedTime;
    }
    return b.price - a.price;
  },
  byPriceInBaseCurrencyAndUpdatedTimeReverse: (a, b) => {
    if (b.priceInBaseCurrency === a.priceInBaseCurrency) {
      return b.updatedTime - a.updatedTime;
    }
    return b.priceInBaseCurrency - a.priceInBaseCurrency;
  },
  byValueAndUpdatedTime: (a, b) => {
    if (a.value === b.value) {
      return a.updatedTime - b.updatedTime;
    }
    return a.value - b.value;
  },
  byValueAndUpdatedTimeReverse: (a, b) => {
    if (b.value === a.value) {
      return b.updatedTime - a.updatedTime;
    }
    return b.value - a.value;
  },
  byBaseSubTotalAndUpdatedTime: (a, b) => {
    if (a.subTotalInBaseCurrency === b.subTotalInBaseCurrency) {
      return a.updatedTime - b.updatedTime;
    }
    return a.subTotalInBaseCurrency - b.subTotalInBaseCurrency;
  },
  byBaseSubTotalAndNormalisedSubTotalAndUpdatedTime: (a, b) => {
    if (a.subTotalInBaseCurrency === b.subTotalInBaseCurrency) {
      if (
        a.subTotalNormalisedInBaseCurrency
        === b.subTotalNormalisedInBaseCurrency
      ) {
        return a.updatedTime - b.updatedTime;
      }
      return (
        a.subTotalNormalisedInBaseCurrency - b.subTotalNormalisedInBaseCurrency
      );
    }
    return a.subTotalInBaseCurrency - b.subTotalInBaseCurrency;
  },
  bySubTotalAndUpdatedTime: (a, b) => {
    if (a.subTotal === b.subTotal) {
      return a.updatedTime - b.updatedTime;
    }
    return a.subTotal - b.subTotal;
  },
  bySubTotalInBaseCurrencyAndUpdatedTime: (a, b) => {
    if (a.subTotalInBaseCurrency === b.subTotalInBaseCurrency) {
      return a.updatedTime - b.updatedTime;
    }
    return a.subTotalInBaseCurrency - b.subTotalInBaseCurrency;
  },
  bySubTotalAndUpdatedTimeReverse: (a, b) => {
    if (b.subTotal === a.subTotal) {
      return b.updatedTime - a.updatedTime;
    }
    return b.subTotal - a.subTotal;
  },
  bySubTotalInBaseCurrencyAndUpdatedTimeReverse: (a, b) => {
    if (b.subTotalInBaseCurrency === a.subTotalInBaseCurrency) {
      return b.updatedTime - a.updatedTime;
    }
    return b.subTotalInBaseCurrency - a.subTotalInBaseCurrency;
  },
  byQuoteValueAndUpdatedTime: (a, b) => {
    if (a.quoteValue === b.quoteValue) {
      return a.updatedTime - b.updatedTime;
    }
    return a.quoteValue - b.quoteValue;
  },
  byBaseQuoteValueAndUpdatedTime: (a, b) => {
    if (a.quoteValueInBaseCurrency === b.quoteValueInBaseCurrency) {
      return a.updatedTime - b.updatedTime;
    }
    return a.quoteValueInBaseCurrency - b.quoteValueInBaseCurrency;
  },
  byBaseQuoteValueAndNormalisedQuoteValueAndUpdatedTime: (a, b) => {
    if (a.quoteValueInBaseCurrency === b.quoteValueInBaseCurrency) {
      if (a.bcNormalisedCurrency === b.bcNormalisedCurrency) {
        return a.updatedTime - b.updatedTime;
      }
      return a.bcNormalisedCurrency - b.bcNormalisedCurrency;
    }
    return a.quoteValueInBaseCurrency - b.quoteValueInBaseCurrency;
  },
  bySubTotalAdditionalValueAndNormalisedValueAndLeadTimeAndUpdatedTime: (
    a,
    b,
  ) => {
    if (a.bcSubTotalAndAdditionalCharges === b.bcSubTotalAndAdditionalCharges) {
      if (
        a.bcNormalisedSubTotalAndAdditionalCharges
        === b.bcNormalisedSubTotalAndAdditionalCharges
      ) {
        if (a.leadTime === b.leadTime) {
          return a.updatedTime - b.updatedTime;
        }
        return b.leadTime - a.leadTime;
      }
      return (
        a.bcNormalisedSubTotalAndAdditionalCharges
        - b.bcNormalisedSubTotalAndAdditionalCharges
      );
    }
    return a.bcSubTotalAndAdditionalCharges - b.bcSubTotalAndAdditionalCharges;
  },
  byTaxRate: (a, b) => a.taxRate - b.taxRate,
  byTaxRateId: (a, b) => a.taxRateId - b.taxRateId,
  byMonthYear: (a, b) => {
    const [monthA, yearA] = a.month_year.split(' ');
    const [monthB, yearB] = b.month_year.split(' ');
    if (yearA !== yearB) {
      return Number(yearA) - Number(yearB);
    }
    return Number(monthA) - Number(monthB);
  },
};

utils.bfs = (tree, collection) => {
  if (!tree.children || tree.children.length === 0) return;
  tree.children.forEach(child => {
    collection.push(child);
    utils.bfs(child, collection);
  });
};

utils.removeAlphaNumericsInString = key => {
  let ret = null;
  if (key) {
    ret = key.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '').replace(/[^\d.-]/g, '');
  }
  return ret;
};

utils.filterObj = (object, conditions) => {
  const filteredObj = {};
  Object.keys(object).forEach(key => {
    const keyObject = object[key];
    const conditionCheck = true;
    if (keyObject) {
      for (const [valuekey, value] of Object.entries(conditions)) {
        if (!keyObject[valuekey] === value) {
          conditionCheck = false;
          break;
        }
      }
      if (conditionCheck) {
        filteredObj[key] = keyObject;
      }
    }
  });
  return filteredObj;
};

utils.validateKnownDateFormat = (input, format) => {
  let result;
  // result = moment(input, format).format('YYYY-MM-DD');
  result = moment(input, [
    'MM-DD-YYYY',
    'MMM-DD-YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'DD-MM-YY',
    'MMM-DD-YYYY',
    'DD-MMM-YYYY',
    'DD-MMM-YY',
  ]).format('YYYY-MM-DD');
  // if (result === 'Invalid date') {
  //   result = moment(input, ['MM-DD-YYYY', 'MMM-DD-YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'DD-MM-YY', 'MMM-DD-YYYY', 'DD-MMM-YYYY', 'DD-MMM-YY']).format('YYYY-MM-DD');
  // }
  if (result === 'Invalid date') {
    result = utils.validateDateFormat(input);
  }
  return result;
};

utils.validateDateFormat = input => {
  let result;
  try {
    result = dateFormat(`${input}`, 'isoDate');
  } catch (e) {
    result = 'invalid';
  }
  return result;
};

// utils.getCleanNotes = (notes) => {
//   if (notes) {
//     return sanitizeHtml(notes, {
//       allowedTags: [
//         'blockquote', 'div', 'li', 'ol', 'p', 'ul', 'b', 'br', 'i', 'span', 'strong', 'em', 'table', 'tbody', 'tr', 'td',
//       ],
//       allowedAttributes: {
//         td: ['rowspan', 'colspan'],
//       },
//       disallowedTagsMode: 'discard',
//       // disallowedTagsMode: 'escape',
//     });
//   }
//   return notes;
// };

utils.getSlugifyLabel = label => label.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');

utils.findApprovals = atis => {
  const approvals = [];
  if (atis && atis.length) {
    atis.forEach(ati => {
      const approvers = [];
      ati.meta.roles.forEach(role => {
        role.Users.forEach(user => {
          approvers.push({ userId: user.id });
        });
      });
      approvals.push({
        approvers,
        approvalTemplateItemId: ati.id,
      });
    });
  }
  return approvals;
};

utils.getMonthNumber = month => {
  const monthNameMap = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  return monthNameMap[month];
};

utils.getFieldType = type => {
  const typeFieldsMapping = {
    purchaseOrders: 'purchaseOrderUserDefinedFields',
    invoices: 'invoiceUserDefinedFields',
    products: 'productUserDefinedFields',
    inwards: 'inwardsUserDefinedFields',
    inwardItems: 'inwardItemsUserDefinedFields',
    invoiceItems: 'invoiceItemsUserDefinedFields',
    purchaseOrderItems: 'purchaseOrderItemsUserDefinedFields',
    sqrItems: 'supplierQuoteRequestItemsUserDefinedFields',
    cndn: 'cndnUserDefinedFields',
    rateContractItems: 'rateContractItemsUserDefinedFields',
    cndnItems: 'cndnItemsUserDefinedFields',
    categories: 'categoryUserDefinedFields',
    quoteRequests: 'quoteRequestUserDefinedFields',
    pettyCashItems: 'pettyCashItemsUserDefinedFields',
    expenseItems: 'expenseItemsUserDefinedFields',
    rcInvoice: 'rcInvoiceUserDefinedFields',
    rcInvoiceItems: 'rcInvoiceItemsUserDefinedFields',
    pettyCash: 'pettyCashUserDefinedFields',
    expense: 'expenseUserDefinedFields',
    travelRequest: 'travelRequestUserDefinedFields',
    nonPoInvoiceItems: 'nonPoInvoiceItemsUserDefinedFields',
    nonPoInvoices: 'nonPoInvoiceUserDefinedFields',
    capexProduct: 'capexProductUserDefinedFields',
    budgetItems: 'budgetItemsUserDefinedFields',
    budget: 'budgetUserDefinedFields',
    dimensionOne: 'dimensionOneUserDefinedFields',
    address: 'addressUserDefinedFields',
  };
  return typeFieldsMapping[type];
};

utils.sliceArrayIntoArrays = (arr, size) => {
  let step = 0;
  const sliceArr = [];
  const len = arr.length;
  while (step < len) {
    sliceArr.push(arr.slice(step, (step += size)));
  }
  return sliceArr;
};

export const ERROR_KEYS = {
  subject: 'subject',
  deliveryAddressId: 'deliveryAddressId',
  budgetItemId: 'budgetItemId',
  companyId: 'companyId',
  costCentreId: 'costCentreId',
  ledgerId: 'ledgerId',
  departmentId: 'departmentId',
  dimensionOneId: 'dimensionOneId',
  dimensionTwoId: 'dimensionTwoId',
  dimensionThreeId: 'dimensionThreeId',
  amendReasons: 'amendReasons',
  supplierId: 'supplierId',
  paymentTerms: 'paymentTerms',
  totalTaxes: 'totalTaxes',
  source: 'source',
  leadTime: 'leadTime',
  acceleratePaymentTerms: 'acceleratePaymentTerms',
  purchaseOrderItems: 'purchaseOrderItems',
  documents: 'documents',
  proFormaInvoiceDate: 'proFormaInvoiceDate',
  reference: 'reference',
  billingAddressId: 'billingAddressId',
};

utils.getPriceFromPriceSlabs = (rci, quantity) => {
  let price = 0;
  quantity = quantity || 0;
  for (let index = 0; index < rci.priceSlabs.length; index++) {
    if (
      +quantity <= +rci.priceSlabs[index].upperLimit
      && +rci.priceSlabs[index].lowerLimit <= +quantity
      && +rci.priceSlabs[index].price
    ) {
      price = rci.priceSlabs[index].price;
      break;
    }
    price = rci.priceSlabs[index].price;
  }
  return price;
};

utils.getDatesDiffInDays = (date1, date2 = new Date()) => {
  if (!date1) return;
  const diffTime = date1 - date2;
  const diffInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffInDays;
};

utils.parseComment = (comment, cappUsers = [], sappUsers = []) => {
  const commentArray = comment.split(' ');
  const commentArrayEntries = commentArray.entries();

  for (const [index, word] of commentArrayEntries) {
    if (word.startsWith('{') && word.endsWith('}')) {
      let userId;
      if (word.match(/(\d+)/)) {
        userId = word.match(/(\d+)/)[0];
      }

      /* If cappUser is tagged */
      const requiredCappUser = cappUsers.find(user => user.userId == userId);
      if (requiredCappUser) {
        commentArray[index] = `@${requiredCappUser.name}`;
      }

      /* If sappUser is tagged */
      const requiredSappUser = sappUsers.find(
        supplier => supplier.supplierId == userId,
      );
      if (requiredSappUser) {
        commentArray[index] = `@${requiredSappUser.name}`;
      }
    }
  }

  return commentArray.join(' ');
};

utils.getAccountingMonthBasedOnFinancialYear = date => {
  date = moment(date);
  if (!date || !date.isValid()) {
    return;
  }

  if (date.month() >= 3) {
    date = date.subtract(3, 'months');
  } else {
    date = date.subtract(1, 'years').add(9, 'months');
  }
  return date.isValid() ? date.format('MM/YYYY') : '-';
};

utils.getLocationCodeFromName = name => {
  if (!name) {
    return;
  }

  /* Ideally this should be kept in a seperate file to export here for one customer or
  maintain in db if multiple customers have this kind of requirement */
  const locationMapping = [
    {
      'Analysis Code': '10001',
      Name: 'MUMBAI CORPORATE OFFICE',
    },
    {
      'Analysis Code': '10002',
      Name: 'GURGAON REGIONAL OFFICE',
    },
    {
      'Analysis Code': '10003',
      Name: 'TAMIL NADU ZONAL OFFICE',
    },
    {
      'Analysis Code': '10004',
      Name: 'WEST BENGAL ZONAL OFFICE',
    },
    {
      'Analysis Code': '10005',
      Name: 'MAHARASHTRA ZONAL OFFICE -1',
    },
    {
      'Analysis Code': '10006',
      Name: 'AHMEDABAD BRANCH OFFICE',
    },
    {
      'Analysis Code': '10007',
      Name: 'BANGALORE BRANCH OFFICE',
    },
    {
      'Analysis Code': '10008',
      Name: 'BHOPAL BRANCH OFFICE',
    },
    {
      'Analysis Code': '10009',
      Name: 'BHUBANESHWAR BRANCH OFFICE',
    },
    {
      'Analysis Code': '10010',
      Name: 'CHANDIGARH BRANCH OFFICE',
    },
    {
      'Analysis Code': '10011',
      Name: 'CHENNAI BRANCH OFFICE',
    },
    {
      'Analysis Code': '10012',
      Name: 'DEHRADUN BRANCH OFFICE',
    },
    {
      'Analysis Code': '10013',
      Name: 'GURGAON BRANCH OFFICE',
    },
    {
      'Analysis Code': '10014',
      Name: 'HYDERABAD BRANCH OFFICE',
    },
    {
      'Analysis Code': '10015',
      Name: 'KOLKATA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10016',
      Name: 'LUCKNOW BRANCH OFFICE',
    },
    {
      'Analysis Code': '10017',
      Name: 'MUMBAI BRANCH OFFICE (Crystal Plaza)',
    },
    {
      'Analysis Code': '10018',
      Name: 'PATNA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10019',
      Name: 'VARANASI BRANCH OFFICE',
    },
    {
      'Analysis Code': '10020',
      Name: 'COIMBATORE BRANCH OFFICE',
    },
    {
      'Analysis Code': '10021',
      Name: 'COCHIN BRANCH OFFICE',
    },
    {
      'Analysis Code': '10022',
      Name: 'JAIPUR BRANCH OFFICE',
    },
    {
      'Analysis Code': '10023',
      Name: 'PPC MAHAPE',
    },
    {
      'Analysis Code': '10024',
      Name: 'BARODA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10025',
      Name: 'KANPUR BRANCH OFFICE',
    },
    {
      'Analysis Code': '10026',
      Name: 'SATNA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10027',
      Name: 'INDORE BRANCH OFFICE',
    },
    {
      'Analysis Code': '10028',
      Name: 'NAGPUR BRANCH OFFICE',
    },
    {
      'Analysis Code': '10029',
      Name: 'CHATTISGARH BRANCH',
    },
    {
      'Analysis Code': '10030',
      Name: 'RANCHI BRANCH OFFICE',
    },
    {
      'Analysis Code': '10031',
      Name: 'DIBRUGARH BRANCH OFFICE',
    },
    {
      'Analysis Code': '10032',
      Name: 'VISAKHAPATNAM BRANCH',
    },
    {
      'Analysis Code': '10033',
      Name: 'TRIVANDRUM',
    },
    {
      'Analysis Code': '10034',
      Name: 'PUNE BRANCH OFFICE',
    },
    {
      'Analysis Code': '10035',
      Name: 'KOTA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10036',
      Name: 'LUDHIANA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10037',
      Name: 'NOIDA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10038',
      Name: 'MANGALORE BRANCH OFFICE',
    },
    {
      'Analysis Code': '10039',
      Name: 'RAIPUR BRANCH OFFICE',
    },
    {
      'Analysis Code': '10040',
      Name: 'SURAT BRANCH OFFICE',
    },
    {
      'Analysis Code': '10041',
      Name: 'HALDWANI BRANCH',
    },
    {
      'Analysis Code': '10042',
      Name: 'DAKC',
    },
    {
      'Analysis Code': '10043',
      Name: 'ANGUL BRANCH',
    },
    {
      'Analysis Code': '10044',
      Name: 'VIJAYAWADA BRANCH',
    },
    {
      'Analysis Code': '10045',
      Name: 'VASHI BRANCH',
    },
    {
      'Analysis Code': '10046',
      Name: 'DELHI BRANCH OFFICE (PRITAMPURA)',
    },
    {
      'Analysis Code': '10047',
      Name: 'GUWAHATI BRANCH OFFICE',
    },
    {
      'Analysis Code': '10048',
      Name: 'JALANDHAR BRANCH',
    },
    {
      'Analysis Code': '10049',
      Name: 'JAMMU BRANCH OFFICE',
    },
    {
      'Analysis Code': '10050',
      Name: 'RAGHUNATHGANJ BRANCH',
    },
    {
      'Analysis Code': '10051',
      Name: 'RAJKOT',
    },
    {
      'Analysis Code': '10052',
      Name: 'SILIGURI',
    },
    {
      'Analysis Code': '10053',
      Name: 'CHENNAI- (KILPAK)BRANCH OFFICE',
    },
    {
      'Analysis Code': '10054',
      Name: 'DADAR BRANCH',
    },
    {
      'Analysis Code': '10055',
      Name: 'AGRA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10056',
      Name: 'GURGAON - BRANCH OFFICE',
    },
    {
      'Analysis Code': '10057',
      Name: 'VARANASI-PPC',
    },
    {
      'Analysis Code': '10058',
      Name: 'GURGAON ZONAL OFFICE',
    },
    {
      'Analysis Code': '10059',
      Name: 'UDAIPUR',
    },
    {
      'Analysis Code': '10060',
      Name: 'NOIDA ZONAL OFFICE',
    },
    {
      'Analysis Code': '10061',
      Name: 'HUBLI BRANCH',
    },
    {
      'Analysis Code': '10062',
      Name: 'VARANASI-TRAINING CENTRE',
    },
    {
      'Analysis Code': '10063',
      Name: 'RAGHUNATHGANJ TRAINING CENTRE',
    },
    {
      'Analysis Code': '10064',
      Name: 'JAMSHEDPUR BRANCH',
    },
    {
      'Analysis Code': '10065',
      Name: 'FORT BRANCH',
    },
    {
      'Analysis Code': '10066',
      Name: 'KARNAL BRANCH OFFICE',
    },
    {
      'Analysis Code': '10067',
      Name: 'SOUTH DELHI BRANCH OFFICE',
    },
    {
      'Analysis Code': '10068',
      Name: 'FARIDABAD BRANCH',
    },
    {
      'Analysis Code': '10069',
      Name: 'VARANASI-GUEST HOUSE',
    },
    {
      'Analysis Code': '10070',
      Name: 'ALWAR BRANCH',
    },
    {
      'Analysis Code': '10071',
      Name: 'SHIMOGA BRANCH',
    },
    {
      'Analysis Code': '10072',
      Name: 'ALLAHABAD BRANCH',
    },
    {
      'Analysis Code': '10073',
      Name: 'NASHIK BRANCH',
    },
    {
      'Analysis Code': '10074',
      Name: 'MORADABAD BRANCH',
    },
    {
      'Analysis Code': '10075',
      Name: 'THANE BRANCH',
    },
    {
      'Analysis Code': '10076',
      Name: 'MYSORE BRANCH',
    },
    {
      'Analysis Code': '10077',
      Name: 'BORIVALI BRANCH',
    },
    {
      'Analysis Code': '10078',
      Name: 'AMRITSAR BRANCH',
    },
    {
      'Analysis Code': '10079',
      Name: 'JABALPUR BRANCH',
    },
    {
      'Analysis Code': '10080',
      Name: 'MEERUT BRANCH',
    },
    {
      'Analysis Code': '10081',
      Name: 'MADURAI BRANCH',
    },
    {
      'Analysis Code': '10082',
      Name: 'AURANGABAD BRANCH OFFICE',
    },
    {
      'Analysis Code': '10083',
      Name: 'ASANSOL BRANCH',
    },
    {
      'Analysis Code': '10084',
      Name: 'KARAIKKUDI BRANCH',
    },
    {
      'Analysis Code': '10085',
      Name: 'KARAIKKUDI TRAINING CENTER',
    },
    {
      'Analysis Code': '10086',
      Name: 'NOIDA AGENT TRAINING CENTRE',
    },
    {
      'Analysis Code': '10087',
      Name: 'M P ZONAL OFFICE',
    },
    {
      'Analysis Code': '10088',
      Name: 'FAIZABAD BRANCH OFFICE',
    },
    {
      'Analysis Code': '10089',
      Name: 'GORAKHPUR (UP)',
    },
    {
      'Analysis Code': '10090',
      Name: 'JHANSI',
    },
    {
      'Analysis Code': '10091',
      Name: 'GOA BRANCH',
    },
    {
      'Analysis Code': '10092',
      Name: 'ETAWAH BRANCH OFFICE',
    },
    {
      'Analysis Code': '10093',
      Name: 'KOLKATA SALT LAKE BRANCH',
    },
    {
      'Analysis Code': '10094',
      Name: 'ANDHERI BRANCH',
    },
    {
      'Analysis Code': '10095',
      Name: 'MAHARASHTRA ZONAL OFFICE -1 (MUMBAI)',
    },
    {
      'Analysis Code': '10096',
      Name: 'GOREGAON BRANCH',
    },
    {
      'Analysis Code': '10097',
      Name: 'BHOPAL STAFF TRAINING CENTRE',
    },
    {
      'Analysis Code': '10098',
      Name: 'ANDHRA PRADESH ZONAL OFFICE',
    },
    {
      'Analysis Code': '10099',
      Name: 'SECUNDERABAD BRANCH',
    },
    {
      'Analysis Code': '10100',
      Name: 'MAHARASHTRA ZONAL OFFICE -2 (PUNE)',
    },
    {
      'Analysis Code': '10101',
      Name: 'MUZAFFARPUR BRANCH',
    },
    {
      'Analysis Code': '10102',
      Name: 'CUTTACK BRANCH',
    },
    {
      'Analysis Code': '10103',
      Name: 'NOIDA HEALTH BRANCH',
    },
    {
      'Analysis Code': '10104',
      Name: 'GURGAON BRANCH II (BLOCK A)-(SEC-44)',
    },
    {
      'Analysis Code': '10105',
      Name: 'BAREILLY BRANCH',
    },
    {
      'Analysis Code': '10106',
      Name: 'BODHGAYA BRANCH',
    },
    {
      'Analysis Code': '10107',
      Name: 'TRICHY BRANCH',
    },
    {
      'Analysis Code': '10108',
      Name: 'BRARAI (BHAGALPUR) BRANCH',
    },
    {
      'Analysis Code': '10109',
      Name: 'SAHARANPUR BRANCH (U.P.)',
    },
    {
      'Analysis Code': '10110',
      Name: 'GONDA BRANCH (U.P.)',
    },
    {
      'Analysis Code': '10111',
      Name: 'RAJASTHAN ZONAL OFFICE',
    },
    {
      'Analysis Code': '10112',
      Name: 'VARANASI ZONAL OFFICE',
    },
    {
      'Analysis Code': '10113',
      Name: 'ORISSA ZONAL OFFICE',
    },
    {
      'Analysis Code': '10114',
      Name: 'KARNATAKA ZONAL OFFICE',
    },
    {
      'Analysis Code': '10115',
      Name: 'GUJARAT ZONAL OFFICE',
    },
    {
      'Analysis Code': '10116',
      Name: 'LUCKNOW ZONAL OFFICE',
    },
    {
      'Analysis Code': '10117',
      Name: 'TAMIL NADU ZONAL OFFICE 2',
    },
    {
      'Analysis Code': '10118',
      Name: 'KERALA ZONAL OFFICE',
    },
    {
      'Analysis Code': '10119',
      Name: 'PUNJAB ZONAL OFFICE',
    },
    {
      'Analysis Code': '10120',
      Name: 'PATNA ZONAL OFFICE',
    },
    {
      'Analysis Code': '10121',
      Name: 'MAHAPE AGENT TRAINING CENTRE',
    },
    {
      'Analysis Code': '10122',
      Name: 'BANGALORE AGENT TRAINING CENTRE',
    },
    {
      'Analysis Code': '10123',
      Name: 'NEW DELHI (LAXMI NAGAR) BRANCH',
    },
    {
      'Analysis Code': '10124',
      Name: 'ROBERTSGANJ (U.P)',
    },
    {
      'Analysis Code': '10125',
      Name: 'BAHRAICH (UP)',
    },
    {
      'Analysis Code': '10126',
      Name: 'BANGALORE GUEST HOUSE',
    },
    {
      'Analysis Code': '10127',
      Name: 'ANJANGAON BARI (AMRAVATI)',
    },
    {
      'Analysis Code': '10128',
      Name: 'BHALKI BRANCH',
    },
    {
      'Analysis Code': '10129',
      Name: 'BASAVAKALYAN BRANCH',
    },
    {
      'Analysis Code': '10130',
      Name: 'KALABURGI BRANCH',
    },
    {
      'Analysis Code': '10131',
      Name: 'BIDAR BRANCH',
    },
    {
      'Analysis Code': '10132',
      Name: 'AIROLI HUB OFFICE',
    },
    {
      'Analysis Code': '10133',
      Name: 'AURAD BRANCH OFFICE',
    },
    {
      'Analysis Code': '10134',
      Name: 'BELAGAVI BRANCH OFFICE',
    },
    {
      'Analysis Code': '10135',
      Name: 'CHITRADURGA BRANCH OFFICE',
    },
    {
      'Analysis Code': '10136',
      Name: 'DAVANGERE BRANCH OFFICE',
    },
    {
      'Analysis Code': '10137',
      Name: 'KOLAR BRANCH OFFICE',
    },
    {
      'Analysis Code': '10138',
      Name: 'HOMNABAD',
    },
    {
      'Analysis Code': '10139',
      Name: 'YADGIR',
    },
    {
      'Analysis Code': '10140',
      Name: 'RAMANAGARA',
    },
    {
      'Analysis Code': '_NA',
      Name: 'NOT APPLICABE',
    },
  ];
  for (const location of locationMapping) {
    if (
      location
      && location.Name
      && location.Name.toLowerCase().trim() === name.toLowerCase().trim()
    ) {
      return location['Analysis Code'];
    }
  }
};

utils.getTaxCode = description => {
  if (!description) {
    return;
  }
  /* Ideally this should be kept in a seperate file to export here for one customer or
  maintain in db if multiple customers have this kind of requirement */
  const taxCodeMapping = [
    {
      'Account Code': '1060200041',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-COMM-AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200042',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-COMM-AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200043',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-COMM-AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200044',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-COMM-AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200045',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-COMM-CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200046',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-COMM-CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200047',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-COMM-CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200048',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-COMM-CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '1060200049',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-COMM-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200050',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-COMM-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200051',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-COMM-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200052',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-COMM-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200057',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-COMM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200058',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-COMM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200059',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-COMM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200060',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-COMM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200065',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200066',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200067',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200068',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200073',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '1060200074',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '1060200076',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '1060200081',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '1060200082',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '1060200084',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '1060200089',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '1060200090',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '1060200092',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '1060200113',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200114',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200115',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200116',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '1060200118',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '1060200119',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '1060200120',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '1060200121',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '1060200127',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-COM-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '1060200128',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-COMM-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '1060200129',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-COMM-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '1060200130',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-COMM-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '1060200136',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200137',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200138',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200139',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '1060200140',
      Description: 'GST CENVAT Receivable',
      Status: 'O',
    },
    {
      'Account Code': '1060200144',
      Description: 'CGST CREDIT RECEIVEABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '1060200145',
      Description: 'SGST CREDIT RECEIVEABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '1060200146',
      Description: 'UTGST CREDIT RECEIVEABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '1060200147',
      Description: 'IGST CREDIT RECEIVEABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '1060200148',
      Description: 'CGST CASH BALANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200149',
      Description: 'SGST CASH BALANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200150',
      Description: 'IGST CASH BALANCE',
      Status: 'O',
    },
    {
      'Account Code': '1060200151',
      Description: 'IGST TDS receivable',
      Status: 'O',
    },
    {
      'Account Code': '1060200152',
      Description: 'CGST TDS receivable',
      Status: 'O',
    },
    {
      'Account Code': '1060200153',
      Description: 'SGST TDS receivable',
      Status: 'O',
    },
    {
      'Account Code': '1060200154',
      Description: 'CGST CREDIT AVAILABLE FOR UTILISATION',
      Status: 'O',
    },
    {
      'Account Code': '1060200155',
      Description: 'SGST CREDIT AVAILABLE FOR UTILISATION',
      Status: 'O',
    },
    {
      'Account Code': '1060200156',
      Description: 'UGST CREDIT AVAILABLE FOR UTILISATION',
      Status: 'O',
    },
    {
      'Account Code': '1060200157',
      Description: 'IGST CREDIT AVAILABLE FOR UTILISATION',
      Status: 'O',
    },
    {
      'Account Code': '1060200158',
      Description: 'INPUT CREDIT CGST UTILITY/ PETTY CASH',
      Status: 'O',
    },
    {
      'Account Code': '1060200159',
      Description: 'INPUT CREDIT SGST UTILITY/ PETTY CASH',
      Status: 'O',
    },
    {
      'Account Code': '1060200160',
      Description: 'INPUT CREDIT UGST UTILITY/ PETTY CASH',
      Status: 'O',
    },
    {
      'Account Code': '1060200161',
      Description: 'INPUT CREDIT IGST UTILITY/ PETTY CASH',
      Status: 'O',
    },
    {
      'Account Code': '1060200162',
      Description: 'GST Credit on Inter Branch Supply',
      Status: 'O',
    },
    {
      'Account Code': '1060200163',
      Description: 'GST on Hold',
      Status: 'O',
    },
    {
      'Account Code': '2080503065',
      Description: 'GST J&K Sales tax payables - Premiums',
      Status: 'O',
    },
    {
      'Account Code': '2080503070',
      Description: 'GST J&K Surcharge on Sales tax payables-Premiums',
      Status: 'O',
    },
    {
      'Account Code': '2080503071',
      Description: 'CGST PAYABLE-PREMIUM',
      Status: 'O',
    },
    {
      'Account Code': '2080503072',
      Description: 'SGST PAYABLE-PREMIUM',
      Status: 'O',
    },
    {
      'Account Code': '2080503073',
      Description: 'UTGST PAYABLE-PREMIUM',
      Status: 'O',
    },
    {
      'Account Code': '2080503074',
      Description: 'IGST PAYABLE-PREMIUM',
      Status: 'O',
    },
    {
      'Account Code': '2080503075',
      Description: 'CGST Payable- Reinsurance Premium',
      Status: 'O',
    },
    {
      'Account Code': '2080503076',
      Description: 'SGST Payable- Reinsurance Premium',
      Status: 'O',
    },
    {
      'Account Code': '2080503077',
      Description: 'IGST Payable- Reinsurance Premium',
      Status: 'O',
    },
    {
      'Account Code': '2080503087',
      Description: 'CGST PAYABLE-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503088',
      Description: 'SGST PAYABLE-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503089',
      Description: 'UTGST PAYABLE-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503090',
      Description: 'IGST PAYABLE-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503094',
      Description: 'CGST PAYABLE-RCM-COMMISSION AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503095',
      Description: 'SGST PAYABLE-RCM-COMMISSION AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503096',
      Description: 'UTGST PAYABLE-RCM-COMMISSION AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503097',
      Description: 'IGST PAYABLE-RCM-COMMISSION AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503098',
      Description: 'CGST PAYABLE-RCM-COMMISSION  CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503099',
      Description: 'SGST PAYABLE-RCM-COMMISSION  CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503101',
      Description: 'IGST PAYABLE-RCM-COMMISSION  CORPORATE AGENTS',
      Status: 'O',
    },
    {
      'Account Code': '2080503102',
      Description: 'CGST PAYABLE-RCM-COMMISSION BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503103',
      Description: 'SGST PAYABLE-RCM-COMMISSION BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503104',
      Description: 'UTGST PAYABLE-RCM-COMMISSION BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503105',
      Description: 'IGST PAYABLE-RCM-COMMISSION BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503110',
      Description: 'CGST PAYABLE-RCM-COMMISSION OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503111',
      Description: 'SGST PAYABLE-RCM-COMMISSION  OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503112',
      Description: 'UTGST PAYABLE-RCM-COMMISSION OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503113',
      Description: 'IGST PAYABLE-RCM-COMMISSION OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '2080503119',
      Description: 'SGST PAYABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503120',
      Description: 'UTGST PAYABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503121',
      Description: 'IGST PAYABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503126',
      Description: 'CGST PAYABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503127',
      Description: 'SGST PAYABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503128',
      Description: 'UTGST PAYABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503129',
      Description: 'IGST PAYABLE-RCM-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '2080503134',
      Description: 'CGST PAYABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '2080503135',
      Description: 'SGST PAYABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '2080503136',
      Description: 'UTGST PAYABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '2080503137',
      Description: 'IGST PAYABLE-RCM-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '2080503142',
      Description: 'CGST PAYABLE-RCM-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '2080503143',
      Description: 'SGST PAYABLE-RCM-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '2080503145',
      Description: 'IGST PAYABLE-RCM-CLAIM-GARAGE-(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '2080503150',
      Description: 'CGST PAYABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '2080503151',
      Description: 'SGST PAYABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '2080503152',
      Description: 'UTGST PAYABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '2080503153',
      Description: 'IGST PAYABLE-RCM-CLAIM-LAWYER',
      Status: 'O',
    },
    {
      'Account Code': '2080503158',
      Description: 'CGST PAYABLE-RCM-CLAIM-TPA',
      Status: 'O',
    },
    {
      'Account Code': '2080503159',
      Description: 'SGST PAYABLE-RCM-CLAIM-TPA',
      Status: 'O',
    },
    {
      'Account Code': '2080503160',
      Description: 'UTGST PAYABLE-RCM-CLAIM-TPA',
      Status: 'O',
    },
    {
      'Account Code': '2080503161',
      Description: 'IGST PAYABLE-RCM-CLAIM-TPA',
      Status: 'O',
    },
    {
      'Account Code': '2080503166',
      Description: 'CGST PAYABLE-RCM-CLAIM-MONITORING FEES',
      Status: 'O',
    },
    {
      'Account Code': '2080503182',
      Description: 'CGST PAYABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '2080503183',
      Description: 'SGST PAYABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '2080503184',
      Description: 'UTGST PAYABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '2080503185',
      Description: 'IGST PAYABLE-RCM-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '2080503190',
      Description: 'CGST PAYABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '2080503191',
      Description: 'CGST PAYABLE-RCM-COMMISSION WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '2080503192',
      Description: 'SGST PAYABLE-RCM-COMMISSION WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '2080503193',
      Description: 'UTGST PAYABLE-RCM-COMMISSION WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '2080503194',
      Description: 'IGST PAYABLE-RCM-COMMISSION WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '2080503198',
      Description: 'CGST PAYABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503199',
      Description: 'SGST PAYABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503200',
      Description: 'UTGST PAYABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503201',
      Description: 'IGST PAYABLE-RCM-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '2080503202',
      Description: 'GST Payable',
      Status: 'O',
    },
    {
      'Account Code': '2080503205',
      Description: 'SGST PAYABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '2080503206',
      Description: 'UTGST PAYABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '2080503207',
      Description: 'IGST PAYABLE-RCM-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '2080503208',
      Description: 'GST- Kerala Flood Cess',
      Status: 'O',
    },
    {
      'Account Code': '2080503209',
      Description: 'CGST PAYABLE -CO INSURANCE ADMIN CHGS',
      Status: 'O',
    },
    {
      'Account Code': '2080503210',
      Description: 'SGST PAYABLE-CO INSURANCE ADMIN CHGS',
      Status: 'O',
    },
    {
      'Account Code': '2080503211',
      Description: 'UTGST PAYABLE-CO INSURANCE ADMIN CHGS',
      Status: 'O',
    },
    {
      'Account Code': '2080503212',
      Description: 'IGST PAYABLE-CO INSURANCE ADMIN CHGS',
      Status: 'O',
    },
    {
      'Account Code': '2080503213',
      Description: 'VENDOR CGST PAYABLE',
      Status: 'O',
    },
    {
      'Account Code': '2080503214',
      Description: 'VENDOR SGST PAYABLE',
      Status: 'O',
    },
    {
      'Account Code': '2080503215',
      Description: 'VENDOR UGST PAYABLE',
      Status: 'O',
    },
    {
      'Account Code': '2080503216',
      Description: 'VENDOR IGST PAYABLE',
      Status: 'O',
    },
    {
      'Account Code': '4080000081',
      Description: 'CGST RECEIVEABLE-COMMISSION-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000082',
      Description: 'SGST RECEIVEABLE-COMMISSION-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000083',
      Description: 'UTGST RECEIVEABLE-COMMISSION-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000084',
      Description: 'IGST RECEIVEABLE-COMMISSION-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000089',
      Description: 'CGST RECEIVEABLE-COMMISSION-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000090',
      Description: 'SGST RECEIVEABLE-COMMISSION-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000091',
      Description: 'UTGST RECEIVEABLE-COMMISSION-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000092',
      Description: 'IGST RECEIVEABLE-COMMISSION-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000097',
      Description: 'CGST RECEIVEABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '4080000098',
      Description: 'SGST RECEIVEABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '4080000099',
      Description: 'UTGST RECEIVEABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '4080000100',
      Description: 'IGST RECEIVEABLE-RE INSURANCE',
      Status: 'O',
    },
    {
      'Account Code': '4080000105',
      Description: 'CGST RECEIVEABLE-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '4080000106',
      Description: 'SGST RECEIVEABLE-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '4080000108',
      Description: 'IGST RECEIVEABLE-CLAIM-SURVEYORS',
      Status: 'O',
    },
    {
      'Account Code': '4080000113',
      Description: 'CGST RECEIVEABLE-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '4080000114',
      Description: 'SGST RECEIVEABLE-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '4080000116',
      Description: 'IGST RECEIVEABLE-CLAIM-GARAGE(REIMB)',
      Status: 'O',
    },
    {
      'Account Code': '4080000121',
      Description: 'CGST RECEIVEABLE-CLAIM-GARAGE-CASHLESS-B2B',
      Status: 'O',
    },
    {
      'Account Code': '4080000122',
      Description: 'SGST RECEIVEABLE-CLAIM-GARAGE-CASHLESS-B2B',
      Status: 'O',
    },
    {
      'Account Code': '4080000123',
      Description: 'UTGST RECEIVEABLE-CLAIM-GARAGE-CASHLESS-B2B',
      Status: 'O',
    },
    {
      'Account Code': '4080000124',
      Description: 'IGST RECEIVEABLE-CLAIM-GARAGE-CASHLESS-B2B',
      Status: 'O',
    },
    {
      'Account Code': '4080000129',
      Description: 'CGST RECEIVEABLE-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000130',
      Description: 'SGST RECEIVEABLE-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000131',
      Description: 'UTGST RECEIVEABLE-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000132',
      Description: 'IGST RECEIVEABLE-CLAIM-OTHERS',
      Status: 'O',
    },
    {
      'Account Code': '4080000137',
      Description: 'CGST RECEIVEABLE-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '4080000138',
      Description: 'SGST RECEIVEABLE-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '4080000139',
      Description: 'UTGST RECEIVEABLE-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '4080000140',
      Description: 'IGST RECEIVEABLE-EXPENSES',
      Status: 'O',
    },
    {
      'Account Code': '4080000146',
      Description: 'CGST RECEIVEABLE-COMMISSION-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '4080000147',
      Description: 'SGST RECEIVEABLE-COMMISSION-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '4080000148',
      Description: 'UTGST RECEIVEABLE-COMMISSION-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '4080000149',
      Description: 'IGST RECEIVEABLE-COMMISSION-WEB AGGREGATOR',
      Status: 'O',
    },
    {
      'Account Code': '4080000151',
      Description: 'CGST RECEIVEABLE-COMMISSION-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '4080000152',
      Description: 'SGST RECEIVEABLE-COMMISSION-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '4080000153',
      Description: 'UTGST RECEIVEABLE-COMMISSION-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '4080000154',
      Description: 'IGST RECEIVEABLE-COMMISSION-MISP-DEALER',
      Status: 'O',
    },
    {
      'Account Code': '4080000155',
      Description: 'CGST RECEIVEABLE-COMMISSION-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000156',
      Description: 'SGST RECEIVEABLE-COMMISSION-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000157',
      Description: 'UTGST RECEIVEABLE-COMMISSION-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000158',
      Description: 'IGST RECEIVEABLE-COMMISSION-MISP-BROKER',
      Status: 'O',
    },
    {
      'Account Code': '4080000159',
      Description: 'CGST RECEIVABLE-ISD',
      Status: 'O',
    },
    {
      'Account Code': '4080000160',
      Description: 'SGST RECEIVABLE-ISD',
      Status: 'O',
    },
    {
      'Account Code': '4080000161',
      Description: 'IGST RECEIVABLE-ISD',
      Status: 'O',
    },
  ];
  for (const tax of taxCodeMapping) {
    if (
      tax
      && tax.Description
      && tax.Description.toLowerCase().trim() === description.toLowerCase().trim()
    ) {
      return tax['Account Code'];
    }
  }
};

utils.getSupplierGSTStateCode = tinNo => {
  if (!tinNo) {
    return;
  }

  const gstStateCodeMapping = [
    {
      'Sr. No.': 1,
      'State Name': 'Andaman and Nicobar Islands',
      'TIN number': '35',
      'State Code': 'AN',
    },
    {
      'Sr. No.': 2,
      'State Name': 'Andhra Pradesh',
      'TIN number': '28',
      'State Code': 'AP',
    },
    {
      'Sr. No.': 3,
      'State Name': 'Andhra Pradesh (New)',
      'TIN number': '37',
      'State Code': 'AD',
    },
    {
      'Sr. No.': 4,
      'State Name': 'Arunachal Pradesh',
      'TIN number': '12',
      'State Code': 'AR',
    },
    {
      'Sr. No.': 5,
      'State Name': 'Assam',
      'TIN number': '18',
      'State Code': 'AS',
    },
    {
      'Sr. No.': 6,
      'State Name': 'Bihar',
      'TIN number': '10',
      'State Code': 'BH',
    },
    {
      'Sr. No.': 7,
      'State Name': 'Chandigarh',
      'TIN number': '04',
      'State Code': 'CH',
    },
    {
      'Sr. No.': 8,
      'State Name': 'Chattisgarh',
      'TIN number': '22',
      'State Code': 'CT',
    },
    {
      'Sr. No.': 9,
      'State Name': 'Dadra and Nagar Haveli',
      'TIN number': '26',
      'State Code': 'DN',
    },
    {
      'Sr. No.': 10,
      'State Name': 'Daman and Diu',
      'TIN number': '25',
      'State Code': 'DD',
    },
    {
      'Sr. No.': 11,
      'State Name': 'Delhi',
      'TIN number': '07',
      'State Code': 'DL',
    },
    {
      'Sr. No.': 12,
      'State Name': 'Goa',
      'TIN number': '30',
      'State Code': 'GA',
    },
    {
      'Sr. No.': 13,
      'State Name': 'Gujarat',
      'TIN number': '24',
      'State Code': 'GJ',
    },
    {
      'Sr. No.': 14,
      'State Name': 'Haryana',
      'TIN number': '06',
      'State Code': 'HR',
    },
    {
      'Sr. No.': 15,
      'State Name': 'Himachal Pradesh',
      'TIN number': '02',
      'State Code': 'HP',
    },
    {
      'Sr. No.': 16,
      'State Name': 'Jammu and Kashmir',
      'TIN number': '01',
      'State Code': 'JK',
    },
    {
      'Sr. No.': 17,
      'State Name': 'Jharkhand',
      'TIN number': '20',
      'State Code': 'JH',
    },
    {
      'Sr. No.': 18,
      'State Name': 'Karnataka',
      'TIN number': '29',
      'State Code': 'KA',
    },
    {
      'Sr. No.': 19,
      'State Name': 'Kerala',
      'TIN number': '32',
      'State Code': 'KL',
    },
    {
      'Sr. No.': 20,
      'State Name': 'Lakshadweep Islands',
      'TIN number': '31',
      'State Code': 'LD',
    },
    {
      'Sr. No.': 21,
      'State Name': 'Madhya Pradesh',
      'TIN number': '23',
      'State Code': 'MP',
    },
    {
      'Sr. No.': 22,
      'State Name': 'Maharashtra',
      'TIN number': '27',
      'State Code': 'MH',
    },
    {
      'Sr. No.': 23,
      'State Name': 'Manipur',
      'TIN number': '14',
      'State Code': 'MN',
    },
    {
      'Sr. No.': 24,
      'State Name': 'Meghalaya',
      'TIN number': '17',
      'State Code': 'ME',
    },
    {
      'Sr. No.': 25,
      'State Name': 'Mizoram',
      'TIN number': '15',
      'State Code': 'MI',
    },
    {
      'Sr. No.': 26,
      'State Name': 'Nagaland',
      'TIN number': '13',
      'State Code': 'NL',
    },
    {
      'Sr. No.': 27,
      'State Name': 'Odisha',
      'TIN number': '21',
      'State Code': 'OR',
    },
    {
      'Sr. No.': 28,
      'State Name': 'Pondicherry',
      'TIN number': '34',
      'State Code': 'PY',
    },
    {
      'Sr. No.': 29,
      'State Name': 'Punjab',
      'TIN number': '03',
      'State Code': 'PB',
    },
    {
      'Sr. No.': 30,
      'State Name': 'Rajasthan',
      'TIN number': '08',
      'State Code': 'RJ',
    },
    {
      'Sr. No.': 31,
      'State Name': 'Sikkim',
      'TIN number': '11',
      'State Code': 'SK',
    },
    {
      'Sr. No.': 32,
      'State Name': 'Tamil Nadu',
      'TIN number': '33',
      'State Code': 'TN',
    },
    {
      'Sr. No.': 33,
      'State Name': 'Telangana',
      'TIN number': '36',
      'State Code': 'TS',
    },
    {
      'Sr. No.': 34,
      'State Name': 'Tripura',
      'TIN number': '16',
      'State Code': 'TR',
    },
    {
      'Sr. No.': 35,
      'State Name': 'Uttar Pradesh',
      'TIN number': '09',
      'State Code': 'UP',
    },
    {
      'Sr. No.': 36,
      'State Name': 'Uttarakhand',
      'TIN number': '05',
      'State Code': 'UT',
    },
    {
      'Sr. No.': 37,
      'State Name': 'West Bengal',
      'TIN number': '19',
      'State Code': 'WB',
    },
    {
      'Sr. No.': 38,
      'State Name': 'Dadra & Nagar Haveli and Daman & Diu',
      'TIN number': '26',
      'State Code': 'DNHDD',
    },
    {
      'Sr. No.': 39,
      'State Name': 'Ladakh',
      'TIN number': '38',
      'State Code': 'LA',
    },
    {
      'Sr. No.': 40,
      'State Name': 'Other Territory',
      'TIN number': '97',
      'State Code': 'OT',
    },
  ];

  for (const gstData of gstStateCodeMapping) {
    if (gstData && gstData['TIN number'] && gstData['TIN number'] == tinNo) {
      return gstData['State Code'];
    }
  }
};

/* Reports route path name and service mapping */
// utils.reportsRouteAndServiceMapping = {
//   rfqs: reportService.findAllForRFQSReportGeneration,
//   payables: reportService.findAllForPayablesReportGeneration,
//   grns: reportService.findAllForStockInwardsReportGeneration,
//   auctions: reportService.findAllForAuctionsReportGeneration,
//   inventory: reportService.findAllForInventoryReportGeneration,
//   'purchase-orders': reportService.findAllForPurchaseOrdersReportGeneration,
//   'purchase-invoices': reportService.findAllForPurchaseInvoicesReportGeneration,
//   'rate-contracts': reportService.findAllForRateContractsReportGeneration,
//   'purchase-requisitions':
//     reportService.findAllForPurchaseRequisitionsReportGeneration,
//   'proforma-invoices': reportService.findAllForProformaInvoicesReportGeneration,
//   'vendor-master': reportService.findAllForVendorMasterReportGeneration,
//   'product-master': reportService.findAllForProductMasterReportGeneration,
//   'po-with-products': reportService.findAllForPOsWithProductsReportGeneration,
//   'sun-system-upload-invoices-report':
//     reportService.generateReportForInvoicesSunsytemUpload,
//   'sun-system-upload-pfi-report':
//     reportService.generateReportForPFISunsytemUpload,
//   'bank-upload-us': reportService.generateReportForBankUploadUniversalSampo,
//   'vendor-details-us':
//     reportService.generateReportForVendorDetailsUniversalSampo,
//   'vendor-bank-info-us':
//     reportService.generateReportForVendorBankDetailsUniversalSampo,
//   'pi-with-products': reportService.findAllForPIsWithProductsReportGeneration,
//   'rc-with-products': reportService.findAllForRCsWithProductsReportGeneration,
//   'inwards-with-products':
//     reportService.findAllForInwardsWithProductsReportGeneration,
//   'asset-issue': reportService.findAllForAssetIssueReportGeneration,
//   'stock-issues': reportService.findAllForStockIssuesReportGeneration,
//   'asset-inventory': reportService.findAllForAssetInventoryReportGeneration,
//   'gst-reconciliation-data': reportService.findAllGstDataForReconciliation,
//   'quote-requests': reportService.findAllQuoteRequestPricingOnSupplier,
//   'quote-requests-questionnaire':
//     reportService.findAllQuoteRequestQuestionaireSummary,
//   'quote-request-negotiation': reportService.downloadQuoteNegotiationExcel,
//   'budget-consolidated-report': reportService.budgetConsolidatedReport,
//   'requisition-consolidated-report':
//     reportService.RequisitionConsolidatedReport,
//   'pr-with-products': reportService.findAllForPRsWithProductsReportGeneration,
//   'user-report': reportService.generateUserReport,
//   'quote-comparisons': reportService.findAllForQuoteComparisonReportGeneration,
//   'payment-voucher-items': reportService.findAllForPVIsReportGeneration,
//   'supplier-categories': reportService.findAllSupplierCategories,
//   'product-categories': reportService.findAllProductCategories,
//   'expense-report': reportService.findAllExpensesAndTravel,
//   'petty-cash-sunsystem-report':
//     reportService.findAllPettyCashForSunsystemReport,
//   'consolidated-quotations': reportService.findAllConsolidatedQuotationsReport,
//   'provision-items': reportService.generateReportForProvisionItems,
//   'rfq-supplier-quote-report':
//     reportService.findAllRFQsForSupplierQuoteReportGeneration,
//   'prepaid-monthly-split':
//     reportService.findAllPrepaidInvoicesForAerchainReport,

//   'expense-sunsystem-report': reportService.findAllExpensesForSunsystemReport,
//   'invoice-sunsystem-report': reportService.findAllInvoicesForSunsystemReport,
//   'proforma-invoice-sunsystem-report':
//     reportService.findAllProformaInvoicesForSunsystemReport,
//   'prepaid-invoice-sunsystem-report':
//     reportService.findAllPrepaidInvoicesForSunsystemReport,
//   'role-report': reportService.findAllRoles,
//   'auction-item-report': reportService.findAllAuctionsItemReport,
//   'budget-item-report': reportService.findAllBudgetItemReport,
//   'budget-consumption-report': reportService.findAllBudgetConsumptionReport,
// };

utils.gettransactionIdKeyMapping = moduleName => {
  const transactionIdKeyMapping = {
    budget: 'budgetId',
    invoice: 'invoiceId',
    'non-po-invoice': 'invoiceId',
    'rc-invoice': 'invoiceId',
    schedule: 'purchaseOrderId',
    'credit-debit-note': 'invoiceId',
    'proforma-invoice-po': 'proFormaInvoiceId',
    'proforma-invoice-non-po': 'proFormaInvoiceId',
    'invoice-accounting': 'invoiceId',
    'auction-request': 'auctionRequestId',
    requisition: 'requisitionId',
    'quote-request': 'quoteRequestId',
    'purchase-order': 'purchaseOrderId',
    'rate-contract': 'rateContractId',
    'auction-comparison': 'auctionComparisonId',
    'quote-comparison': 'quoteComparisonId',
    'payment-run': 'paymentRunId',
    expense: 'expenseId',
    products: 'productId',
    'stock-inward': 'stockInwardId',
    'expense-accounting': 'expenseId',
    'travel-request': 'travelRequestId',
  };

  if (transactionIdKeyMapping[moduleName]) {
    return transactionIdKeyMapping[moduleName];
  }
};

utils.getSanitizedModuleName = (moduleName, moduleAction) => {
  if (
    ['rc-invoice', 'invoice', 'non-po-invoice'].includes(moduleName)
    && moduleAction === 'account'
  ) {
    return 'invoice-accounting';
  } if (['expense'].includes(moduleName) && moduleAction === 'account') {
    return 'expense-accounting';
  }
  return moduleName;
};

utils.getTransactionKeysForRoleCheck = moduleName => {
  const transactionIdKeyMapping = {
    budget: ['budgetView', 'budgetApprove'],
    invoice: ['invoiceView', 'invoiceApprove'],
    'non-po-invoice': ['nonPOSpendView', 'nonPOSpendApprove'],
    'rc-invoice': ['invoiceView', 'invoiceApprove'],
    schedule: ['scheduleView', 'scheduleApprove'],
    'credit-debit-note': ['invoiceAccountingView', 'cndnCreateApprove'],
    'proforma-invoice-po': ['invoiceView', 'invoiceApprove'],
    'proforma-invoice-non-po': ['nonPOSpendView', 'nonPOSpendApprove'],
    'invoice-accounting': ['invoiceAccountingView', 'invoiceAccountingApprove'],
    'auction-requests': ['auctionRequestView', 'auctionRequestApprove'],
    requisition: ['requisitionView', 'requisitionApprove'],
    'quote-request': ['quoteRequestView', 'quoteRequestApprove'],
    'purchase-order': ['purchaseOrderView', 'purchaseOrderApprove'],
    'rate-contract': ['rateContractView', 'rateContractApprove'],
    'auction-comparision': ['auctionRequestView', 'auctionComparisonApprove'],
    'quote-comparison': ['quoteRequestView', 'quoteComparisonApprove'],
    'payment-run': ['paymentVoucherView', 'paymentVoucherApprove'],
    expense: ['expenseView', 'expenseApprove'],
    'expense-accounting': ['expenseAccountingView', 'expenseAccountingApprove'],
    products: ['productView', 'productApprove'],
    'stock-inward': ['stockInwardView', 'stockInwardApprove'],
    'credit-debit-note-accounting': ['invoiceAccountingView', 'cndnApprove'],
  };

  if (transactionIdKeyMapping[moduleName]) {
    return transactionIdKeyMapping[moduleName];
  }
};

utils.getStateCodeForGst = stateName => {
  const stateVsGstMap = {
    'andaman-and-nicobar-islands-an': '35',
    'andhra-pradesh-ap': '37',
    'arunachal-pradesh-ar': '12',
    'assam-as': '18',
    'bihar-br': '10',
    'chandigarh-cg': '04',
    'chhattisgarh-ch': '22',
    'dadra-and-nagar-haveli-dn': '26',
    'daman-and-diu-dd': '25',
    'delhi-dl': '07',
    'goa-ga': '30',
    'gujrat-gj': '24',
    'haryana-hr': '06',
    'himachal-pradesh-hp': '02',
    'jammu-and-kashmir-jk': '01',
    'jharkhand-jh': '20',
    'karnataka-ka': '29',
    'kerala-kl': '32',
    'ladakh-la': '38',
    'lakshadweep-ld': '31',
    'madhya-pradesh-mp': '23',
    'maharashtra-mh': '27',
    'manipur-mn': '14',
    'meghalaya-ml': '17',
    'mizoram-mz': '15',
    'nagaland-nl': '13',
    'odisa-od': '21',
    'pondicherry-py': '34',
    'punjab-pb': '03',
    'rajasthan-rj': '08',
    'sikkim-sk': '11',
    'tamilnadu-tn': '33',
    'telangana-ts': '36',
    'tripura-tr': '16',
    'uttar-pradesh-up': '09',
    'uttarakhand-uk': '05',
    'west-bangal-wb': '19',
  };
  if (stateVsGstMap[stateName]) {
    return stateVsGstMap[stateName];
  }
};

// utils.calculateGstType = async (billingAddressId, companyId, supplierId, auth) => {
//   const customerGSTIN = await addressService.getGSTIN(billingAddressId, companyId, auth);
//   const supplier = await supplierService.getGSTIN(supplierId, auth);
//   const supplierGSTIN = supplier.gstin ? supplier.gstin.trim() : '';
//   let gstType = 2;
//   if (supplier.isDomesticVendor) {
//     if (customerGSTIN && supplierGSTIN) {
//       if (customerGSTIN.substring(0, 2) === supplierGSTIN.substring(0, 2)) {
//         if (['04', '31', '35', '38', '26'].includes(customerGSTIN.substring(0, 2))) {
//           gstType = 3; // CGST + UTGST
//         } else {
//           gstType = 1;
//         }
//       }
//     } else {
//       const supplierStateCode = await utils.getStateCodeForGst(utils.slugify(supplier.SD.billingAddressState))
//       if (customerGSTIN.substring(0, 2) === supplierStateCode) {
//         if (['04', '31', '35', '38', '26'].includes(customerGSTIN.substring(0, 2))) {
//           gstType = 3; // CGST + UTGST
//         } else {
//           gstType = 1;
//         }
//       }
//     }
//   }
//   return gstType;
// };

utils.amendKeys = (obj, keys, values) => {
  keys.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      values[key] = obj[key];
    }
  });
  return values;
};

utils.getEndOfTheDayTimestamp = () => moment().endOf('day').toDate();

utils.getEndOfTheDayTimeDiffInHours = () => moment().endOf('day').diff(moment(), 'hours');

utils.getDiffInHours = (date1, date2 = new Date()) => {
  const startDate = moment(date1, 'YYYY-MM-DD');
  const endDate = moment(date2, 'YYYY-MM-DD');
  const duration = endDate.diff(startDate, 'hours');
  return duration;
};

utils.getConversionAndTransaction = type => {
  if (type) {
    if (type === 'auctions') {
      return {
        comparison: 'Auction Comparison',
        comparisonRoute: 'auction-comparisons',
        transaction: 'Auction',
        transactionRoute: 'auction-requests',
      };
    }
    return {
      comparison: 'Quote Comparison',
      comparisonRoute: 'quote-comparisons',
      transaction: 'RFQ',
      transactionRoute: 'quote-requests',
    };
  }
  return {
    comparison: 'Requisition Conversion',
    comparisonRoute: 'requisition-conversion',
    transaction: 'Requisition',
    transactionRoute: 'requisitions',
  };
};

utils.getJarvisBaseURL = () => {
  let jarvisBaseURL;
  if (_get(config, 'app.jarvis.noAuthUrl')) {
    jarvisBaseURL = _get(config, 'app.jarvis.noAuthUrl');
  } else {
    jarvisBaseURL = 'https://jarvisuat.aerchain.io/api/no-auth';
  }
  return jarvisBaseURL;
};

utils.getFormattedAddress = (address = {}) => {
  let formatedAddress = '';
  const requiredAddressKeys = Object.keys(address);
  requiredAddressKeys.forEach((key, index) => {
    if (address[key]) {
      if (index !== requiredAddressKeys.length - 1) {
        formatedAddress += `${address[key]}, `;
      } else {
        formatedAddress += `${address[key]}.`;
      }
    }
  });
  return formatedAddress;
};

utils.getDayNumbersBasedOnWeekDays = dayNumbersString => {
  const weekdays = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  const weekDayInNumbersArray = dayNumbersString
    .split(',')
    .map(day => weekdays[day.toLowerCase()]);
  return weekDayInNumbersArray;
};

utils.matchMonthAndYear = (date1, date2) => {
  if (date1 && date2) {
    const momentDate1 = moment(date1, 'YYYY-MM-DD');
    const momentDate2 = moment(date2, 'YYYY-MM-DD');

    if (
      momentDate1.month() === momentDate2.month()
      && momentDate1.year() === momentDate2.year()
    ) {
      return true;
    }
    return false;
  }
  return false;
};

utils.matchDates = (date1, date2) => {
  if (date1 && date2) {
    const momentDate1 = moment(date1, 'YYYY-MM-DD');
    const momentDate2 = moment(date2, 'YYYY-MM-DD');

    if (momentDate1.isSame(momentDate2)) {
      return true;
    }
    return false;
  }
  return false;
};

utils.getArraySum = (array, field) => array.reduce(
  (accumulator, currentObject) => accumulator + (currentObject[field] || 0),
  0,
);

utils.getFormattedPrice = (price, currency) => {
  if (!price) {
    throw new Error('Price not found');
  }

  if (!currency) {
    throw new Error('Currency not found');
  }

  if (isNaN(price)) {
    return price;
  }

  if (currency.toLowerCase() === 'inr') {
    return price.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  } /* if (currency.toLowerCase() === 'usd') */
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

utils.dimensionsFilterForControllers = options => {
  const dimensionFilters = {
    deliveryAddressIds: 'deliveryAddressId',
    departmentIds: 'departmentId',
    ledgerIds: 'ledgerId',
    costCentreIds: 'costCentreId',
    dimensionOneIds: 'dimensionOneId',
    dimensionTwoIds: 'dimensionTwoId',
    dimensionThreeIds: 'dimensionThreeId',
  };
  if (['rate-contract-item', 'inwards-items'].includes(options.module)) {
    delete dimensionFilters.deliveryAddressIds;
  }
  const filter = {
    where: {},
    include: [],
  };
  for (const [key, value] of Object.entries(options)) {
    if (dimensionFilters[key]) {
      const dimensionIds = Array.isArray(value) ? value : [value];
      const filterCondition = {
        [Op.or]: {
          [Op.in]: dimensionIds.filter(id => id !== 'NA'),
        },
      };

      if (dimensionIds.includes('NA') || !options.dimensionFilterEnabled) {
        filterCondition[Op.or][Op.is] = null;
      }

      if (options.module === 'inwards' && key === 'deliveryAddressIds') {
        filter.where.addressId = filterCondition;
      } else if (
        options.module === 'purchase-order-item'
        && key === 'deliveryAddressIds'
      ) {
        filter.include.push({
          model: db.PurchaseOrder,
          as: 'PO',
          where: {
            deliveryAddressId: filterCondition,
          },
          attributes: ['id'],
        });
      } else if (
        options.module === 'rate-contract'
        && key === 'costCentreIds'
      ) {
        filter.include.push({
          model: db.RateContractCostCentreMapping,
          as: 'RCCCMs',
          separate: true,
          where: {
            costCentreId: filterCondition,
          },
        });
      } else if (
        options.module === 'rate-contract-item'
        && key === 'costCentreIds'
      ) {
        filter.include.push({
          model: db.RateContract,
          as: 'RC',
          attributes: ['id'],
          required: true,
          include: [
            {
              model: db.RateContractCostCentreMapping,
              as: 'RCCCMs',
              where: {
                costCentreId: filterCondition,
              },
              attributes: ['id', 'rateContractId', 'costCentreId'],
            },
          ],
        });
      } else {
        filter.where[dimensionFilters[key]] = filterCondition;
      }
    }
  }
  return filter;
};

utils.stringifyAndTrim = val => {
  if (val === null || val === undefined) {
    return val;
  }
  return val.toString().trim();
};

utils.applyExcludeSelectedAndFindApprovals = atis => {
  const approvals = [];
  const selectedUsers = [];
  if (atis && atis.length) {
    atis.forEach(ati => {
      const approvers = [];
      ati.meta.roles.forEach(role => {
        role.Users.forEach(user => {
          if (!selectedUsers.includes(user.id)) {
            approvers.push({ userId: user.id });
            selectedUsers.push(user.id);
          }
        });
      });
      if (approvers.length > 0) {
        approvals.push({
          approvers,
          approvalTemplateItemId: ati.id,
        });
      }
    });
  }
  return approvals;
};

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
utils.useCustomNanoId = customAlphabet(alphabet, 12);

utils.deepCopy = data => JSON.parse(JSON.stringify(data));

export default utils;
