import CompanyAddressMappingController from '../controllers/companyAddressMappingController';
import utils from '../../helpers/utils';

const companyAddressMappingService = {};

companyAddressMappingService.bulkCreateForAddressId = async (records, addressId, auth, approversExist) => {
  const companyAddressMappingController = new CompanyAddressMappingController(auth.customerId);
  const camRecords = records.map((record) => {
    const camRecord = utils.copyKeys(record, ['companyId', 'gstin', 'corporateIdentificationNumber']);
    camRecord.addressId = addressId;
    camRecord.active = approversExist !== undefined ? approversExist : 1;
    return camRecord;
  });
  return companyAddressMappingController.bulkCreate(camRecords);
};


companyAddressMappingService.bulkCheckandCreateForAddressId = async (camRecords, addressId, auth) => {
  const companyAddressMappingController = new CompanyAddressMappingController(auth.customerId);
  const recordsToUpdate = [];
  const recordsToDelete = [];
  const recordsToCreate = [];
  camRecords.forEach((cam) => {
    if (cam.id) {
      if (cam.method === 'UPDATE') {
        recordsToUpdate.push({
          id: cam.id,
          gstin: cam.gstin,
          corporateIdentificationNumber: cam.corporateIdentificationNumber,
        });
      } else if (cam.method === 'DELETE') {
        recordsToDelete.push(cam.id);
      }
    } else {
      const camRecord = utils.copyKeys(cam, ['companyId', 'gstin', 'corporateIdentificationNumber']);
      camRecord.addressId = +addressId;
      recordsToCreate.push(camRecord);
    }
  });
  await companyAddressMappingController.bulkDeleteByIds(recordsToDelete);
  await Promise.all(recordsToUpdate.map(record => companyAddressMappingController.updateById({
    gstin: record.gstin,
    corporateIdentificationNumber: record.corporateIdentificationNumber,
  }, record.id)));
  await companyAddressMappingController.bulkCreate(recordsToCreate);
};

export default companyAddressMappingService;
