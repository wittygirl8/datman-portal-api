f= open('out.js', 'w')
f.write('''
const DATA_SIZE = 100
const faker = require('faker');
const db = require('./db')
Sequelize = db.Sequelize
sequelize = db.sequelize
''')

with open('query.sql') as rf1:
    for i, line in enumerate(rf1):
        # print(i, line)
        if i==0:
             table_name= line.split('`')[1]
             f.write('''const {0} = sequelize.define('{1}', {{\n\n'''.format(table_name, table_name))
        else:
            try:
                field_name = line.split('`')[1]
            except:
                continue
            if 'PRIMARY KEY' in line or 'KEY' in line or 'ENGINE' in line:
                print 'found something'
                continue
            else:
                f.write('''{0}: {{type: Sequelize.STRING,allowNull: false}},\n'''.format(field_name))
    f.write('},\n{timestamps: false});\n\n')
# rf1.close()



with open('query.sql') as rf2:
    for i, line in enumerate(rf2):
        # print(i, line)
        if i==0:
             table_name= line.split('`')[1]
             f.write('''{0}.sync({{ force: true }}).then(() => {{
             for (let i = 0; i <= DATA_SIZE; i++) {{'''.format(table_name))
            #  exit()

        else:
            try:
                field_name = line.split('`')[1]
            except:
                continue
            if 'PRIMARY KEY' in line or 'KEY' in line or 'ENGINE' in line:
                print 'found something'
                continue
            else:
                f.write('''let {0}= faker\n'''.format(field_name))

with open('query.sql') as rf3:
    for i, line in enumerate(rf3):
        # print(i, line)
        if i==0:
             table_name= line.split('`')[1]
             f.write('''customer1.create({{\n'''.format(table_name))
            #  exit()

        else:
            try:
                field_name = line.split('`')[1]
            except:
                continue
            if 'PRIMARY KEY' in line or 'KEY' in line or 'ENGINE' in line:
                print 'found something'
                continue
            else:
                f.write('''{0},\n'''.format(field_name))
    f.write('''})}})''')