/* eslint-disable no-shadow */
import BillingAddressMappingController from '../controllers/billingAddressMappingController.js';

const billingAddressMappingService = {};

billingAddressMappingService.bulkCreateForAddressId = async (billingAddressIds, addressId, auth) => {
  const billingAddressMappingController = new BillingAddressMappingController(auth.customerId);
  const bamRecords = billingAddressIds.map(billingAddressId => ({
    addressId,
    billingAddressId,
  }));
  return billingAddressMappingController.bulkCreate(bamRecords);
};


billingAddressMappingService.bulkCheckAndCreateForAddressId = async (billingAddressIds, addressId, auth) => {
  const billingAddressMappingController = new BillingAddressMappingController(auth.customerId);
  const bams = await billingAddressMappingController.findAll({
    where: {
      addressId,
    },
  });
  const baIdMapping = {};
  bams.forEach((bam) => {
    baIdMapping[bam.billingAddressId] = {
      bamId: bam.id,
      active: bam.active,
      presentInUpdate: false,
    };
  });
  const markActiveIds = [];
  const markInactiveIds = [];
  const createRecords = [];
  billingAddressIds.forEach((billingAddressId) => {
    if (baIdMapping[billingAddressId]) {
      baIdMapping[billingAddressId].presentInUpdate = true;
      if (!baIdMapping[billingAddressId].active) {
        markActiveIds.push(baIdMapping[billingAddressId].bamId);
      }
    } else {
      createRecords.push({
        billingAddressId,
        addressId,
      });
    }
  });
  Object.values(baIdMapping).filter(mapping => !mapping.presentInUpdate && mapping.active)
    .forEach(mapping => markInactiveIds.push(mapping.bamId));
  if (markActiveIds.length > 0) {
    await billingAddressMappingController.bulkMarkActiveById(markActiveIds);
  }
  if (markInactiveIds.length > 0) {
    await billingAddressMappingController.bulkMarkInactiveById(markInactiveIds);
  }
  if (createRecords.length > 0) {
    await billingAddressMappingController.bulkCreate(createRecords);
  }
};

export default billingAddressMappingService;
