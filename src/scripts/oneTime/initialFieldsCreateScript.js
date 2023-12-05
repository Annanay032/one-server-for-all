
// const run = async () => {
//      await BBPromise.mapSeries(customers, async customer => {
//        console.log(`Start for Customer: ${customer.name} and customerId: ${customer.id}`);
   
//        const auth = {
//          customerId: customer.id,
//        };
//        console.log('Start Templates, Sections, Fields creation');
//        const templateController = new TrTemplateController(auth.customerId);
//        const sectionController = new TrSectionController(auth.customerId);
//        const fieldController = new TrFieldController(auth.customerId);
//        let dimensionChecks = customer;
//        if (customer.rfqConfigurationSettings && customer.rfqConfigurationSettings.isLedgerRequired !== undefined) {
//          dimensionChecks = customer.rfqConfigurationSettings;
//        }
   
//        const addDimensionFields = (Section, sectionName, field) => {
//          Section.fieldOrder.push(generateLabelSlug(sectionName, field.label));
//          Section.Fields.push({
//            type: 'select',
//            options: null,
//            identificationKey: generateLabelSlug(sectionName, field.label),
//            isSystemField: 1,
//            ...field,
//          });
//        };
   
//        const templateObject = {
//          active: 1,
//          label: 'QC Details',
//          isDefault: 1,
//          transactionType: 'quote-comparison',
//          sectionOrder: ['general_details', 'qc_grouped', 'notes_attachments'],
//          groupingKeys: ['qc_grouped_supplier', 'qc_grouped_billing_address', 'qc_grouped_company', 'qc_grouped_delivery_address'],
//          groupingKeyDetails: {
//            qc_grouped_supplier: {
//              label: 'Supplier',
//              type: 'select',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'qc_grouped_supplier',
//              systemKey: 'supplier',
//              isSystemField: 1,
//            },
//            qc_grouped_billing_address: {
//              label: 'Billing Address',
//              type: 'select',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'qc_grouped_billing_address',
//              systemKey: 'billingAddress',
//              isSystemField: 1,
//            },
//            qc_grouped_company: {
//              label: 'Company',
//              type: 'select',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'qc_grouped_company',
//              systemKey: 'company',
//              isSystemField: 1,
//            },
//            qc_grouped_delivery_address: {
//              label: 'Delivery Address',
//              type: 'select',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'qc_grouped_delivery_address',
//              systemKey: 'deliveryAddress',
//              isSystemField: 1,
//            },
//          },
//          Sections: [{
//            label: 'General Details',
//            type: 'form',
//            key: 'general_details',
//            fieldOrder: ['general_details_code', 'general_details_requisition_id', 'general_details_quoteRequest_id', 'general_details_createdAt', 'general_details_total_value', 'general_details_enable_po_autoRelease',
//              'general_details_number_of_quotation_received'],
//            Fields: [{
//              label: 'Code',
//              type: 'text',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'general_details_code',
//              systemKey: 'code',
//              isSystemField: 1,
//              isSystemCalculatedField: 1,
//            }, {
//              label: 'Number Of Quotation Received',
//              type: 'number',
//              options: null,
//              active: 1,
//              mandatory: 'yes',
//              disabled: 'yes',
//              identificationKey: 'general_details_number_of_quotation_received',
//              systemKey: 'numberOfQuotationReceived',
//              isSystemField: 1,
//            }, {
//              label: 'Requisition Id',
//              type: 'transactionField',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'general_details_requisition_id',
//              systemKey: 'requisitionId',
//              isSystemField: 1,
//            }, {
//              label: 'QuoteRequest Id',
//              type: 'transactionField',
//              options: null,
//              mandatory: 'yes',
//              disabled: 'yes',
//              identificationKey: 'general_details_quoteRequest_id',
//              systemKey: 'quoteRequestId',
//              isSystemField: 1,
//            }, {
//              label: 'Created At',
//              type: 'date',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'general_details_createdAt',
//              systemKey: 'createdAt',
//              isSystemField: 1,
//              isSystemCalculatedField: 1,
//            }, {
//              label: 'Enable PO Auto Release',
//              type: 'select',
//              options: ['Yes', 'No'],
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              isSystemCalculatedField: 1,
//              identificationKey: 'general_details_enable_po_autoRelease',
//              systemKey: 'enablePOAutoRelease',
//              isSystemField: 1,
//            }, {
//              label: 'Total Value',
//              type: 'number',
//              options: null,
//              active: 1,
//              mandatory: 'yes',
//              disabled: 'no',
//              aggregateSectionScopeKey: 'aggregate_section',
//              identificationKey: 'general_details_total_value',
//              systemKey: 'totalValue',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'base',
//              formulae: 'SUM({aggregate_section_total_in_base_currency})',
//              isSystemField: 1,
//            }],
//          },
//          {
//            label: 'Quote Comparison View',
//            type: 'grouped_section',
//            key: 'qc_grouped',
//            fieldOrder: [],
//            sectionOrder: ['quote_comparison_section', 'line_item_section', 'aggregate_section'],
//            Fields: [],
//          }, {
//            label: 'Quote Comparison View',
//            type: 'form',
//            key: 'quote_comparison_section',
//            parentSectionKey: 'qc_grouped',
//            groupSectionKey: 'qc_grouped',
//            isGroupedSection: 1,
//            fieldOrder: ['quote_comparison_section_subject', 'quote_comparison_section_supplier',
//              'quote_comparison_section_currency', 'quote_comparison_section_currency_exchange_rate', 'quote_comparison_section_currency_conversion_type', 'quote_comparison_section_payment_terms',
//              'quote_comparison_section_expected_delivery_date'],
//            Fields: [{
//              label: 'Subject',
//              type: 'text',
//              options: null,
//              mandatory: 'yes',
//              disabled: 'no',
//              identificationKey: 'quote_comparison_section_subject',
//              systemKey: 'subject',
//              isSystemField: 1,
//            }, {
//              label: 'Supplier',
//              type: 'select',
//              options: null,
//              mandatory: 'yes',
//              disabledOnConversion: 'yes',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'quote_comparison_section_supplier',
//              systemKey: 'supplier',
//              isSystemField: 1,
//            }, {
//              label: 'Expected Delivery Date',
//              type: 'date',
//              options: null,
//              mandatory: 'yes',
//              disabledOnConversion: 'no',
//              disabledPages: [],
//              identificationKey: 'quote_comparison_section_expected_delivery_date',
//              systemKey: 'expectedDeliveryDate',
//              isSystemField: 1,
//            }, {
//              label: 'Currency',
//              type: 'select',
//              options: null,
//              mandatory: 'yes',
//              disabled: 'yes',
//              identificationKey: 'quote_comparison_section_currency',
//              systemKey: 'currency',
//              isSystemField: 1,
//            }, {
//              label: 'Currency Conversion Type',
//              type: 'select',
//              options: [{ value: 'multiplication', label: 'Multiplication' }, { value: 'division', label: 'Division' }],
//              mandatory: 'yes',
//              disabled: 'yes',
//              identificationKey: 'quote_comparison_section_currency_conversion_type',
//              systemKey: 'conversionType',
//              isSystemField: 1,
//            }, {
//              label: 'Currency Exchange Rate',
//              type: 'number',
//              options: null,
//              mandatory: 'yes',
//              disabled: 'yes',
//              identificationKey: 'quote_comparison_section_currency_exchange_rate',
//              systemKey: 'exchangeRate',
//              isSystemField: 1,
//            }, {
//              label: 'Payment Terms',
//              type: 'select',
//              options: null,
//              mandatory: 'yes',
//              disabled: 'yes',
//              identificationKey: 'quote_comparison_section_payment_terms',
//              systemKey: 'paymentTerms',
//              isSystemField: 1,
//            }],
//          }, {
//            label: 'Line Item Section',
//            type: 'table',
//            key: 'line_item_section',
//            parentSectionKey: 'qc_grouped',
//            groupSectionKey: 'qc_grouped',
//            isGroupedSection: 1,
//            fieldOrder: ['line_item_section_product', 'line_item_section_description', 'line_item_section_uom', 'line_item_section_reasons', 'line_item_section_quantity',
//              'line_item_section_awarded_quantity', 'line_item_section_awarded_quantity_percent', 'line_item_section_hsn', 'line_item_section_best_price', 'line_item_section_sub_total',
//              'line_item_section_tax_percentage', 'line_item_section_quote_price', 'line_item_section_taxes', 'line_item_section_tax_value', 'line_item_section_deductible_tax_percentage', 'line_item_section_deductible_tax_value',
//              'line_item_section_net_tax_percentage', 'line_item_section_net_tax_value', 'line_item_section_total', 'line_item_section_net_total',
//              'line_item_section_requisition_item', 'line_item_section_is_additional_charge_item',
//              'line_item_section_supplier_quote_request_item', 'line_item_section_status', 'line_item_section_boq_item'],
//            Fields: [{
//              label: 'Product',
//              type: 'select',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              disabledOnConversion: 'yes',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_product',
//              systemKey: 'product',
//              isSystemField: 1,
//            }, {
//              label: 'Description',
//              type: 'richText',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_description',
//              systemKey: 'description',
//              isSystemField: 1,
//            }, {
//              label: 'Hsn',
//              type: 'number',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_hsn',
//              systemKey: 'hsn',
//              isSystemField: 1,
//            }, {
//              label: 'Uom',
//              type: 'select',
//              options: null,
//              active: 1,
//              mandatory: 'yes',
//              disabled: 'no',
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_uom',
//              systemKey: 'uom',
//              isSystemField: 1,
//            }, {
//              label: 'Reasons',
//              type: 'richText',
//              options: null,
//              active: 1,
//              mandatory: 'custom',
//              mandatoryFormulae: '{line_item_section_best_price} < {line_item_section_quote_price}',
//              disabled: 'no',
//              identificationKey: 'line_item_section_reasons',
//              systemKey: 'reasons',
//              isSystemField: 1,
//            }, {
//              label: 'Qty',
//              type: 'number',
//              numberFormatting: customer.defaultNumberConvention,
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'yes',
//              disabledOnConversion: 'yes',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_quantity',
//              systemKey: 'totalQuantity',
//              isSystemField: 1,
//            }, {
//              label: 'Awarded Qty Percent',
//              type: 'number',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'yes',
//              disabledOnConversion: 'yes',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_awarded_quantity_percent',
//              systemKey: null,
//              isSystemField: 0,
//              formulae: '{line_item_section_awarded_quantity} * 100/ {line_item_section_quantity}',
//            }, {
//              label: 'Awarded quantity',
//              type: 'number',
//              numberFormatting: customer.defaultNumberConvention,
//              options: null,
//              mandatory: 'yes',
//              disabled: 'no',
//              disabledOnConversion: 'yes',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_awarded_quantity',
//              systemKey: 'awardQuantity',
//              isSystemField: 1,
//            }, {
//              label: 'Quote Price',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              disabledOnConversion: 'yes',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_quote_price',
//              systemKey: 'quotedPrice',
//              isSystemField: 1, // price
//            }, {
//              label: 'Best Price',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              disabledOnConversion: 'yes',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              disabledPages: ['edit', 'create'],
//              identificationKey: 'line_item_section_best_price',
//              systemKey: 'bestPrice',
//              isSystemField: 1, // price
//            }, {
//              label: 'Tax Percent',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_tax_percentage',
//              systemKey: 'nonDeductibleTaxPercentage',
//              isSystemField: 1,
//              formulae: '{line_item_section_taxes}',
//            }, {
//              label: 'Tax Value',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_tax_value',
//              systemKey: null,
//              isSystemField: 0,
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              formulae: '{line_item_section_awarded_quantity} * {line_item_section_quote_price} *  {line_item_section_tax_percentage} * 0.01',
//            }, {
//              label: 'Deductible Tax Percent',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_deductible_tax_percentage',
//              systemKey: 'deductibleTaxPercentage',
//              formulae: '{line_item_section_taxes}',
//              isSystemField: 1,
//            }, {
//              label: 'Deductible Tax Value',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              identificationKey: 'line_item_section_deductible_tax_value',
//              systemKey: null,
//              isSystemField: 0,
//              formulae: '{line_item_section_awarded_quantity} * {line_item_section_quote_price} *  {line_item_section_deductible_tax_percentage} * 0.01',
//            }, {
//              label: 'Net Tax Percent',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_net_tax_percentage',
//              systemKey: null,
//              isSystemField: 0,
//              formulae: '{line_item_section_tax_percentage} - {line_item_section_deductible_tax_percentage}',
//            }, {
//              label: 'Net Tax Value',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_net_tax_value',
//              systemKey: null,
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              isSystemField: 0,
//              formulae: '{line_item_section_tax_value} - {line_item_section_deductible_tax_value}',
//            }, {
//              label: 'Sub Total',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              identificationKey: 'line_item_section_sub_total',
//              systemKey: null,
//              formulae: '{line_item_section_awarded_quantity} * {line_item_section_quote_price}',
//              isSystemField: 0, // price
//            }, {
//              label: 'Total',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_total',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              systemKey: null,
//              formulae: '{line_item_section_sub_total} + {line_item_section_tax_value}',
//              isSystemField: 0, // price
//            }, {
//              label: 'Net Total',
//              type: 'number',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              identificationKey: 'line_item_section_net_total',
//              formulae: '{line_item_section_total}  -  {line_item_section_deductible_tax_value}',
//              systemKey: null,
//              isSystemField: 0,
//            }, {
//              label: 'Taxes',
//              type: 'taxes',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_taxes',
//              systemKey: 'taxes',
//              isSystemField: 1,
//            }, {
//              label: 'Supplier Quote Request Item',
//              type: 'transactionField',
//              options: null,
//              mandatory: 'yes',
//              disabled: 'no',
//              identificationKey: 'line_item_section_supplier_quote_request_item',
//              systemKey: 'supplierQuoteRequestItemId',
//              isSystemField: 1,
//            }, {
//              label: 'Requisition Item',
//              type: 'transactionField',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_requisition_item',
//              systemKey: 'requisitionItemId',
//              isSystemField: 1,
//            }, {
//              label: 'Boq Item',
//              type: 'transactionField',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_boq_item',
//              systemKey: 'boqItemId',
//              isSystemField: 1,
//            }, {
//              label: 'Is Additional Charge Item',
//              type: 'transactionField',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_is_additional_charge_item',
//              systemKey: 'isAdditionalChargeItem',
//              isSystemField: 1,
//            },
//            {
//              label: 'Status',
//              type: 'text',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'line_item_section_status',
//              systemKey: 'status',
//              isSystemField: 1,
//              isSystemCalculatedField: 1,
//            },
//            ],
//          },
//          {
//            label: 'Aggregate Section',
//            type: 'aggregate',
//            key: 'aggregate_section',
//            isGroupedSection: 1,
//            parentSectionKey: 'line_item_section',
//            groupSectionKey: 'qc_grouped',
//            fieldOrder: ['aggregate_section_sub_total', 'aggregate_section_tax_value', 'aggregate_section_deductible_tax_value', 'aggregate_section_net_tax_value', 'aggregate_section_total', 'aggregate_section_total_in_base_currency'],
//            Fields: [{
//              label: 'Sub Total',
//              type: 'aggregate',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'aggregate_section_sub_total',
//              systemKey: null,
//              isSystemField: 0,
//              aggregateSectionScopeKey: 'line_item_section',
//              formulae: 'SUM({line_item_section_sub_total})',
//            }, {
//              label: 'Tax Value',
//              type: 'aggregate',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'aggregate_section_tax_value',
//              systemKey: null,
//              isSystemField: 0,
//              aggregateSectionScopeKey: 'line_item_section',
//              formulae: 'SUM({line_item_section_tax_value})',
//            }, {
//              label: 'Deductible Tax Value',
//              type: 'aggregate',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'aggregate_section_deductible_tax_value',
//              systemKey: null,
//              isSystemField: 0,
//              aggregateSectionScopeKey: 'line_item_section',
//              formulae: 'SUM({line_item_section_deductible_tax_value})',
//            }, {
//              label: 'Net Tax Value',
//              type: 'aggregate',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'aggregate_section_net_tax_value',
//              systemKey: null,
//              isSystemField: 0,
//              aggregateSectionScopeKey: 'line_item_section',
//              formulae: 'SUM({line_item_section_net_tax_value})',
//            }, {
//              label: 'Total',
//              type: 'aggregate',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'transaction',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'aggregate_section_total',
//              systemKey: null,
//              isSystemField: 0,
//              aggregateSectionScopeKey: 'line_item_section',
//              formulae: 'SUM({line_item_section_total})',
//            }, {
//              label: 'Total In Base Currency',
//              type: 'aggregate',
//              numberFormatting: customer.defaultNumberConvention,
//              currencySymbolType: 'base',
//              options: null,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'aggregate_section_total_in_base_currency',
//              systemKey: null,
//              isSystemField: 0,
//              aggregateSectionScopeKey: 'line_item_section',
//              formulae: 'IF("{quote_comparison_section_currency_conversion_type}" === "division", SUM({line_item_section_total})/{quote_comparison_section_currency_exchange_rate}, SUM({line_item_section_total})*{quote_comparison_section_currency_exchange_rate})',
//            }],
//          },
//          {
//            label: 'Notes And Attachments',
//            type: 'notes&attachments',
//            key: 'notes_attachments',
//            fieldOrder: ['notes_attachments_notes', 'notes_attachments_attachments'],
//            Fields: [{
//              label: 'Notes',
//              type: 'richText',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'notes_attachments_notes',
//              isSystemField: 1,
//              systemKey: 'notes',
//            }, {
//              label: 'Attachments',
//              type: 'attachments',
//              options: null,
//              active: 1,
//              mandatory: 'no',
//              disabled: 'no',
//              identificationKey: 'notes_attachments_attachments',
//              systemKey: 'attachments',
//              isSystemField: 1,
//            }],
//          },
//          ],
//        };
   
//        if (customer.enableLineItemBudgets) {
//          templateObject.Sections[3].fieldOrder.push('line_item_section_budget_item', 'line_item_section_budget_item_available_value');
//          templateObject.Sections[3].Fields.push({
//            label: 'Budget',
//            type: 'select',
//            options: null,
//            mandatory: 'no',
//            disabledOnConversion: 'valueDisabled',
//            disabledPages: ['edit', 'create'],
//            identificationKey: 'line_item_section_budget_item',
//            systemKey: 'budgetItem',
//            isSystemField: 1,
//          }, {
//            label: 'Budget Item Available Value',
//            type: 'number',
//            options: null,
//            mandatory: 'no',
//            identificationKey: 'line_item_section_budget_item_available_value',
//            systemKey: 'budgetItemAvailableValue',
//            formulae: '{line_item_section_budget_item}',
//            numberFormatting: customer.defaultNumberConvention,
//            currencySymbolType: 'transaction',
//            isSystemField: 1,
//          });
//        } else {
//          templateObject.Sections[2].fieldOrder.push('quote_comparison_section_budget_item', 'quote_comparison_section_budget_item_available_value');
//          templateObject.Sections[2].Fields.push({
//            label: 'Budget',
//            type: 'select',
//            options: null,
//            mandatory: 'no',
//            disabledOnConversion: 'valueDisabled',
//            disabledPages: ['edit', 'create'],
//            identificationKey: 'quote_comparison_section_budget_item',
//            systemKey: 'budgetItem',
//            isSystemField: 1,
//          }, {
//            label: 'Budget Item Available Value',
//            type: 'number',
//            options: null,
//            mandatory: 'no',
//            identificationKey: 'quote_comparison_section_budget_item_available_value',
//            systemKey: 'budgetItemAvailableValue',
//            formulae: '{quote_comparison_section_budget_item}',
//            numberFormatting: customer.defaultNumberConvention,
//            currencySymbolType: 'transaction',
//            isSystemField: 1,
//          });
//        }
   
//        if (customer.enableLineItemBillingAddress) {
//          const field = {
//            disabledOnConversion: 'yes',
//            disabledPages: ['edit', 'create'],
//            label: customer.billingAddressLabelName || 'Billing Address',
//            systemKey: 'billingAddress',
//            mandatory: 'no',
//          };
//          addDimensionFields(templateObject.Sections[3], 'line_item_section', field);
//          addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//            label: 'Company',
//            type: 'select',
//            options: null,
//            mandatory: 'yes',
//            disabledOnConversion: 'yes',
//            disabledPages: ['edit', 'create'],
//            systemKey: 'company',
//          });
//        } else {
//          const field = {
//            disabledOnConversion: 'yes',
//            disabledPages: ['edit', 'create'],
//            label: customer.billingAddressLabelName || 'Billing Address',
//            systemKey: 'billingAddress',
//            mandatory: 'no',
//          };
//          addDimensionFields(templateObject.Sections[0], 'general_details', field);
//          addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', field);
//          addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//            label: 'Company',
//            type: 'select',
//            options: null,
//            mandatory: 'yes',
//            disabledOnConversion: 'yes',
//            disabledPages: ['edit', 'create'],
//            systemKey: 'company',
//          });
//        }
   
//        if (customer.enableLineItemDeliveryAddress) {
//          const field = {
//            mandatory: 'yes',
//            disabled: 'yes',
//            label: customer.deliveryAddressLabelName || 'Delivery Address',
//            systemKey: 'deliveryAddress',
//          };
//          addDimensionFields(templateObject.Sections[3], 'line_item_section', field);
//        } else {
//          const field = {
//            mandatory: 'no',
//            disabled: 'yes',
//            label: customer.deliveryAddressLabelName || 'Delivery Address',
//            systemKey: 'deliveryAddress',
//          };
//          addDimensionFields(templateObject.Sections[0], 'general_details', field);
//          addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', { ...field, mandatory: 'yes' });
//        }
   
//        if (dimensionChecks.isCostCenterRequired) {
//          const field = {
//            mandatory: dimensionChecks.isCostCenterMandatory ? 'yes' : 'no',
//            disabled: 'yes',
//            label: customer.costCenterLabelName || 'Cost Centre',
//            systemKey: 'costCentre',
//          };
//          if (customer.enableLineItemCostCenters) {
//            addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//              ...field,
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//            });
//          } else {
//            addDimensionFields(templateObject.Sections[0], 'general_details', {
//              ...field,
//              mandatory: 'no',
//            });
//            addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//              ...field,
//              mandatory: 'no',
//            });
//          }
//        }
   
//        if (dimensionChecks.isLedgerRequired) {
//          const field = {
//            mandatory: dimensionChecks.isLedgerMandatory ? 'yes' : 'no',
//            disabled: 'yes',
//            label: customer.ledgerLableName || 'General Ledger',
//            systemKey: 'ledger',
//          };
//          if (customer.enableLineItemLedgers) {
//            addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//              ...field,
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//            });
//          } else {
//            addDimensionFields(templateObject.Sections[0], 'general_details', {
//              ...field,
//              mandatory: 'no',
//            });
//            addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//              ...field,
//              mandatory: 'no',
//            });
//          }
//        }
   
//        if (dimensionChecks.isDepartmentRequired) {
//          const field = {
//            mandatory: dimensionChecks.isDepartmentMandatory ? 'yes' : 'no',
//            disabled: 'yes',
//            label: customer.departmentLableName || 'Department',
//            systemKey: 'department',
//          };
//          if (customer.enableLineItemDepartments) {
//            addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//              ...field,
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//            });
//          } else {
//            addDimensionFields(templateObject.Sections[0], 'general_details', {
//              ...field,
//              mandatory: 'no',
//            });
//            addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//              ...field,
//              mandatory: 'no',
//            });
//          }
//        }
   
//        if (dimensionChecks.isDimensionOneRequired) {
//          const field = {
//            mandatory: dimensionChecks.isDimensionOneMandatory ? 'yes' : 'no',
//            disabled: 'yes',
//            label: customer.dimensionOneLabelName || 'Dimension One',
//            systemKey: 'dimensionOne',
//          };
//          if (customer.enableLineItemDimensionOne) {
//            addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//              ...field,
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//            });
//          } else {
//            addDimensionFields(templateObject.Sections[0], 'general_details', {
//              ...field,
//              mandatory: 'no',
//            });
//            addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//              ...field,
//              mandatory: 'no',
//            });
//          }
//        }
   
//        if (dimensionChecks.isDimensionTwoRequired) {
//          const field = {
//            mandatory: dimensionChecks.isDimensionTwoMandatory ? 'yes' : 'no',
//            disabled: 'yes',
//            label: customer.dimensionTwoLabelName || 'Dimension Two',
//            systemKey: 'dimensionTwo',
//          };
//          if (customer.enableLineItemDimensionTwo) {
//            addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//              ...field,
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//            });
//          } else {
//            addDimensionFields(templateObject.Sections[0], 'general_details', {
//              ...field,
//              mandatory: 'no',
//            });
//            addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//              ...field,
//              mandatory: 'no',
//            });
//          }
//        }
   
//        if (dimensionChecks.isDimensionThreeRequired) {
//          const field = {
//            mandatory: dimensionChecks.isDimensionThreeMandatory ? 'yes' : 'no',
//            disabled: 'yes',
//            label: customer.dimensionThreeLabelName || 'Dimension Three',
//            systemKey: 'dimensionThree',
//          };
//          if (customer.enableLineItemDimensionThree) {
//            addDimensionFields(templateObject.Sections[3], 'line_item_section', {
//              ...field,
//              disabledOnConversion: 'valueDisabled',
//              disabledPages: ['edit', 'create'],
//            });
//          } else {
//            addDimensionFields(templateObject.Sections[0], 'general_details', {
//              ...field,
//              mandatory: 'no',
//            });
//            addDimensionFields(templateObject.Sections[2], 'quote_comparison_section', {
//              ...field,
//              mandatory: 'no',
//            });
//          }
//        }
   
//        Object.values(customer.purchaseOrderUserDefinedFields || {}).forEach(pouserField => {
//          if (pouserField.active) {
//            const identificationKey = `quote_comparison_section_${utils.getSlugifyLabel(pouserField.label)}`;
//            templateObject.Sections[2].fieldOrder.push(identificationKey);
//            templateObject.Sections[2].Fields.push({
//              label: pouserField.label,
//              type: typeFieldsMapping[pouserField.fieldType],
//              options: pouserField.dropDownItems || pouserField.radioOptionItems || null,
//              mandatory: pouserField.mandatory ? 'yes' : 'no',
//              labelSlug: pouserField.labelSlug,
//              disabled: 'no',
//              identificationKey,
//              systemKey: null,
//              isSystemField: 0,
//            });
//          }
//        });
       
//        await templateController.update({
//          isDefault: 0,
//        }, {
//          where: {
//            transactionType: 'quote-comparison',
//          },
//        });
//        const template = await templateController.create(templateObject);
//        await BBPromise.mapSeries(templateObject.Sections, async sectionobj => {
//          sectionobj.templateId = template.id;
//          const section = await sectionController.create(sectionobj);
//          const fieldsObj = sectionobj.Fields.map(field => {
//            field.sectionId = section.id;
//            return field;
//          });
//          await fieldController.bulkCreate(fieldsObj);
//        });
//        console.log('template created id:', template.id);
//        console.log(`End for Customer: ${customer.name} and customerId: ${customer.id}`);
//      });
   
//      console.log('****** END *******');
//    };
   
//    run();