// import utils from '../helpers/utils.js';
import slug from 'slug';

const slugify = val => {
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

export default function (sequelize, DataTypes) {
  const Section = sequelize.define(
    'Section',
    {
      sectionName: {
        type: DataTypes.TEXT,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      reference: {
        type: DataTypes.TEXT,
      },
      sectionType: {
        type: DataTypes.JSONB,
        // custom field, system field
      },
      slug: {
        type: DataTypes.TEXT,
      },
      sno: {
        type: DataTypes.INTEGER,
      },
      key: {
        type: DataTypes.STRING,
      },
      sectionKey: {
        type: DataTypes.STRING,
      },
      delete: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      helpText: {
        type: DataTypes.TEXT,
      },
    },
    {
      hooks: {
        beforeSave: attributes => {
          attributes.set('slug', slugify(attributes.get('sectionName')));
        },
      },
    },
  );

  Section.associate = models => {
    Section.belongsTo(models.CustomModule, {
      foreignKey: {
        fieldName: 'customModuleId',
        allowNull: false,
      },
    });

    Section.hasMany(models.Field, {
      foreignKey: 'sectionId',
    });
  };

  return Section;
}
