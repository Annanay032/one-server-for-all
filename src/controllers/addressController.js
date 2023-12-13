import BaseController from './baseController.js';
import { db, Op, sequelize } from '../models/index.js';

class AddressController extends BaseController {
  constructor(customerId, transaction) {
    super(db.Address, customerId, { transaction });
  }

  findAllForListing(options, auth) {
    const filter = {
      where: {
        // active: 1,
      },
      include: [{
        model: db.BillingAddressMapping,
        as: 'BAMs',
        separate: true,
        where: {
          active: 1,
        },
        required: false,
      }, {
        model: db.Address,
        as: 'DefaultBillingAddress',
        attributes: ['id', 'keyword'],
      }],
    };
    if (options.startsWith) {
      filter.where.keyword = {
        [Op.iLike]: `${options.startsWith}%`,
      };
    }
    if (options.active === '0' || options.active === 0) {
      filter.where.active = 0;
    } else if (options.active === '1' || options.active === 1) {
      filter.where.active = 1;
    }

    if (options.uamActive === '0' || options.uamActive === 0) {
      filter.include.push({
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 0,
          userId: auth.userId,
        },
        required: false,
      });
    } else if (options.uamActive === '1' || options.uamActive === 1) {
      filter.include.push({
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 0,
          userId: auth.userId,
        },
        required: false,
      });
    } else {
      filter.include.push({
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          userId: auth.userId,
        },
        required: false,
      });
    }
    if (options.query) {
      filter.where = {
        [Op.or]: [{
          keyword: {
            [Op.iLike]: `%${options.query}%`,
          },
        }, {
          city: {
            [Op.iLike]: `%${options.query}%`,
          },
        }, {
          state: {
            [Op.iLike]: `%${options.query}%`,
          },
        }],
      };
    }
    if (options.nameQuery) {
      filter.where.keyword = {
        [Op.iLike]: `%${options.nameQuery}%`,
      };
    }
    if (options.stateName) {
      filter.where.state = options.stateName;
    }
    if (options.cityName) {
      filter.where.city = options.cityName;
    }
    if (options.status) {
      filter.where.status = options.status;
    }
    if (options.isBillingAddress) {
      filter.where.isBillingAddress = options.isBillingAddress;
    }
    const paginationOptions = {
      limit: options.limit,
      page: options.page,
    };
    return super.findAndCountAllWithPagination(filter, paginationOptions);
  }

  findOneByIdForView(addressId, options = {}) {
    const uamFilter = {};
    if (options.active) {
      uamFilter.active = +options.active;
    }
    const filter = {
      where: {
        id: addressId,
      },
      include: [{
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          active: 1,
        },
        required: false,
        separate: true,
        include: [{
          model: db.Company,
          attributes: ['id', 'companyName'],
        }],
      }, {
        model: db.UserAddressMapping,
        as: 'UAMs',
        required: false,
        ...(uamFilter.active ? { where: uamFilter } : {}),
        include: [{
          model: db.User,
          attributes: ['id', 'name', 'email'],
        }],
      }, {
        model: db.User,
        attributes: ['id', 'name'],
      }, {
        model: db.Address,
        as: 'DefaultBillingAddress',
        attributes: ['id', 'keyword'],
      }, {
        model: db.BillingAddressMapping,
        as: 'BAMs',
        where: {
          active: 1,
        },
        separate: true,
        required: false,
      }],
    };
    return super.findOne(filter);
  }

  findOneByIdWithCustomer(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      include: [{
        model: db.Customer,
        attributes: ['enableAllocations', 'id'],
      }, {
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          active: 1,
        },
        required: false,
        separate: true,
        include: [{
          model: db.Company,
          attributes: ['id', 'name'],
        }],
      }],
    };
    return super.findOne(filter);
  }

  findOneByIdWithCAMs(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      include: [{
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          active: 1,
        },
        required: false,
        separate: true,
        include: [{
          model: db.Company,
          attributes: ['id', 'name'],
        }],
      }],
    };
    return super.findOne(filter);
  }


  findAllByIdsForRequisitionApproval(addressIds) {
    const filter = {
      where: {
        id: addressIds,
      },
      attributes: ['id'],
      include: [{
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 1,
        },
        include: [{
          model: db.User,
          attributes: ['id', 'name', 'email'],
          include: [{
            model: db.Role,
            where: {
              requisitionApprove: 1,
            },
          }, {
            model: db.ApprovalValueBracket,
            as: 'AVB',
          }],
        }],
      }],
    };
    return super.findAll(filter);
  }

  findAllForOptions(options = {}) {
    const filter = {
      where: {
        active: 1,
      },
      attributes: [['id', 'value'], ['keyword', 'label'], 'isBillingAddress'],
    };
    if (options.query) {
      filter.where.keyword = {
        [Op.iLike]: `%${options.query}%`,
      };
    }
    return super.findAll(filter);
  }

  findOneBySlug(keywordSlug) {
    const filter = {
      where: {
        keywordSlug,
      },
    };
    return super.findOne(filter);
  }

  findAllUamById(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      attributes: ['id', 'keyword'],
      include: [{
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 1,
        },
        include: [{
          model: db.User,
          attributes: ['id', 'name', 'email'],
        }],
      }, {
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          active: 1,
        },
        required: false,
      }],
    };
    return super.findOne(filter);
  }

  findAllInactiveUamAndActiveUserById(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      attributes: ['id', 'keyword'],
      include: [{
        model: db.UserAddressMapping,
        as: 'UAMs',
        // required: false,
        include: [{
          model: db.User,
          where: {
            active: 1,
          },
          attributes: ['id', 'name', 'email', 'addressAdmin', 'costCentreAdmin', 'ledgerAdmin'],
        }],
      }, {
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          active: 0,
        },
      }],
    };
    return super.findOne(filter);
  }

  findAllAddressesByKeywords(addressKeywordslugs) {
    const filter = {
      where: {
        keywordSlug: addressKeywordslugs,
      },
    };
    return super.findAll(filter);
  }

  findAllDistinctCityNames(options) {
    const filter = {
      plain: false,
      where: {},
    };
    return super.aggregate('city', 'DISTINCT', filter);
  }

  findAllDistinctStateNames(options) {
    const filter = {
      plain: false,
      where: {},
      // attributes: ['id', 'keyword', 'city'],
    };
    return super.aggregate('state', 'DISTINCT', filter);
  }

  findOneByIdWithLowStockInventories(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      include: [{
        model: db.Inventory,
        where: {
          active: 1,
          quantity: {
            [Op.lt]: sequelize.col('reorderQuantity'),
          },
        },
        required: true,
        include: [{
          model: db.Product,
        }],
      }, {
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 1,
        },
        required: false,
        include: [{
          model: db.User,
          attributes: ['id', 'name', 'email'],
          required: true,
          include: [{
            model: db.EmailMapping,
            where: {
              lowStockReminderToUser: 1,
            },
            attributes: ['id', 'lowStockReminderToUser'],
          }],
        }],
      }, {
        model: db.Customer,
        attributes: ['id', 'name', 'domain'],
      }],
    };
    return super.findOne(filter);
  }

  findAllAddressesForCompany(options) {
    const filter = {
      where: {
        active: 1,
        isBillingAddress: 1,
      },
      include: [{
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          companyId: options.companyId,
        },
        required: true,
      }],
    };
    return super.findAll(filter);
  }

  findAllAddressessBySlugs(distintSlugs, isBillingAddress) {
    const filter = {
      where: {
        keywordSlug: distintSlugs,
        active: 1,
      },
      attributes: ['id', 'keyword', 'keywordSlug', 'isBillingAddress'],
    };
    if(isBillingAddress) {
      filter.where.isBillingAddress = 1;
    }
    return super.findAll(filter);
  }

  findOneByIdWithApprovals(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      include: [{
        model: db.Approval,
        as: 'Approvals',
        where: {
          active: 1,
        },
        required: false,
      }],
      order: [
        [{ model: db.Approval, as: 'Approvals' }, 'sequence', 'ASC'],
      ],
    };
    return super.findOne(filter);
  }

  findOneByIdForEmailAndSms(addressId) {
    const filter = {
      where: {
        id: addressId,
      },
      attributes: ['id', 'keyword', 'userId', 'customerId'],
      include: [{
        model: db.User,
        attributes: ['id', 'name', 'email', 'phone'],
      }, {
        model: db.Customer,
        attributes: ['id', 'name', 'domain'],
      }],
    };
    return super.findOne(filter);
  }

  findAllForStatusCount(options = {}) {
    const filter = {
      where: {},
      include: [],
      group: ['Address.status'],
      attributes: ['Address.status', [sequelize.fn('COUNT', 'Address.status'), 'count']],
      raw: true,
    };
    if (options.startsWith) {
      filter.where.keyword = {
        [Op.iLike]: `${options.startsWith}%`,
      };
    }
    // if (options.active === 'inactive') {
    //   filter.where.active = 0;
    // } else if (options.active !== 'all') {
    //   filter.where.active = 1;
    // }
    if (options.query) {
      filter.where = {
        [Op.or]: [{
          keyword: {
            [Op.iLike]: `%${options.query}%`,
          },
        }, {
          city: {
            [Op.iLike]: `%${options.query}%`,
          },
        }, {
          state: {
            [Op.iLike]: `%${options.query}%`,
          },
        }],
      };
    }
    if (options.nameQuery) {
      filter.where.keyword = {
        [Op.iLike]: `%${options.nameQuery}%`,
      };
    }
    if (options.stateName) {
      filter.where.state = options.stateName;
    }
    if (options.cityName) {
      filter.where.city = options.cityName;
    }
    if (options.status) {
      filter.where.status = options.status;
    }
    return super.findAll(filter);
  }

  findOneByReference(reference) {
    const filter = {
      where: {
        reference,
      },
      // attributes: ['id', 'name'],
    };
    return super.findOne(filter);
  }

  findAllByReferences(references) {
    const filter = {
      where: {
        reference: references,
      },
    };
    return super.findAll(filter);
  }

  findAllAddressesWithUams(userId, options = {}) {
    const uamFilter = {
      active: 1,
    };
    if (userId) {
      uamFilter.userId = userId;
    }
    const filter = {
      attributes: ['id', 'name', 'keywordSlug', 'keyword'],
      where: {
        active: 1,
      },
      include: [{
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: uamFilter,
      }],
    };
    if (options.isBillingAddress) {
      filter.where.isBillingAddress = 1;
    }
    return super.findAll(filter);
  }

  findAllForListingInTransactions(options) {
    const filter = {
      where: {
        active: 1,
      },
      attributes: ['id', 'keyword', 'name', 'reference'],
    };
    return super.findAll(filter);
  }

  findAllwithUserMappings(auth, adminAccess) {
    const filter = {
      where: {
        active: 1,
      },
      attributes: ['id', 'name', 'reference', 'keyword'],
      include: [],
    };
    if (!adminAccess) {
      filter.include.push({
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 1,
          userId: auth.userId,
        },
      });
    }
    return super.findAll(filter);
  }

  findAllForBulkUpload(distinctAddressesNames, auth, adminAccess) {
    const filter = {
      where: {
        active: 1,
        keyword: {
          [Op.in]: distinctAddressesNames,
        },
      },
      raw: true,
      attributes: ['id', 'keyword'],
      include: [],
    };
    if (!adminAccess) {
      filter.include.push({
        model: db.UserAddressMapping,
        as: 'UAMs',
        where: {
          active: 1,
          userId: auth.userId,
        },
      });
    }
    return super.findAll(filter);
  }

  findAllActiveAddresses() {
    const filter = {
      where: {
        active: 1,
      },
      attributes: ['id', 'name', 'keyword', 'isBillingAddress', 'defaultBillingAddressId'],
      include: [{
        model: db.BillingAddressMapping,
        as: 'BAMs',
        where: {
          active: 1,
        },
        required: false,
      }],
    };
    return super.findAll(filter);
  }

  findAllAddressessBySlugsWithCAMs(distintSlugs, isBillingAddress) {
    const filter = {
      where: {
        keywordSlug: distintSlugs,
        active: 1,
      },
      attributes: ['id', 'keyword', 'keywordSlug', 'isBillingAddress'],
      include: [{
        model: db.CompanyAddressMapping,
        as: 'CAMs',
        where: {
          active: 1,
        },
        separate: true,
        required: false,
      }],
    };
    if (isBillingAddress) {
      filter.where.isBillingAddress = 1;
    }
    return super.findAll(filter);
  }
}

export default AddressController;
