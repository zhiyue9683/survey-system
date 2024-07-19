const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const db = mysql.createConnection({
    host: '8.137.71.219',
    user: 'root',
    password: '123456',
    database: 'survey_system',
    
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database.');
});

app.get('/', (req, res) => {
    res.send('欢迎来到我们的研究平台！');
});

app.post('/basic-info', (req, res) => {
    const { age, gender, country } = req.body;
    
    const query = 'INSERT INTO users (age, gender, country) VALUES (?, ?, ?)';
    db.query(query, [age, gender, country], (err, result) => {
        if (err) throw err;
        res.send({ userId: result.insertId });
    });
});

app.post('/consent', (req, res) => {
    const { userId, consent } = req.body;

    if (consent === '同意') {
        res.send({ message: 'Thank you for your consent', userId });
    } else {
        res.send({ message: 'You have opted out of the survey' });
    }
});

app.post('/submit-survey', (req, res) => {
    const {
        userId, productType, preferenceReason, purchaseFrequency, 
        importancePrice, importanceQuality, importanceEnvironment,
        importanceBrand, importanceDesign, longTermValue, recommendFriends
    } = req.body;

    const query = `
        INSERT INTO responses 
        (user_id, product_type, preference_reason, purchase_frequency, 
        importance_price, importance_quality, importance_environment,
        importance_brand, importance_design, long_term_value, recommend_friends)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        userId, productType, preferenceReason.join(','), purchaseFrequency, 
        importancePrice, importanceQuality, importanceEnvironment,
        importanceBrand, importanceDesign, longTermValue, recommendFriends
    ], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Survey response submitted successfully' });
    });
});

app.get('/thank-you', (req, res) => {
    res.send('感谢您的参与！我们真诚地感谢您花时间和精力参与我们的研究。');
});




app.post('/stats', (req, res) => {
    const {type} = req.body
    let param = ''
    if (type) {
        param = ' where product_type = \'' + type + '\'' 
    }
    
    const productTypeQuery = 'SELECT product_type, count(1) AS count FROM responses a GROUP BY a.product_type';
    const preferenceReasonQuery = 'SELECT preference_reason FROM responses'+ param + ' ';
    const otherFieldsQuery = 'SELECT purchase_frequency, importance_price, importance_quality, importance_environment, importance_brand, importance_design, long_term_value, recommend_friends, COUNT(*) as count FROM responses'+ param + '  GROUP BY purchase_frequency, importance_price, importance_quality, importance_environment, importance_brand, importance_design, long_term_value, recommend_friends';

    const personTypeQuery1 = 'SELECT age, count(1) AS count FROM responses a inner join users b on a.user_id = b.id'+ param + ' GROUP BY b.age';
    const personTypeQuery2 = 'SELECT gender, count(1) AS count FROM responses a inner join users b on a.user_id = b.id'+ param + ' GROUP BY b.gender';
    const personTypeQuery3 = 'SELECT country, count(1) AS count FROM responses a inner join users b on a.user_id = b.id'+ param + ' GROUP BY b.country';

    db.query(productTypeQuery, (err, productTypeResults) => {
        if (err) throw err;

        db.query(preferenceReasonQuery, (err, preferenceReasonResults) => {
            if (err) throw err;

            db.query(otherFieldsQuery, (err, otherFieldsResults) => {
                if (err) throw err;
                db.query(personTypeQuery1, (err, personType1Results) => {
                    if (err) throw err;
                    db.query(personTypeQuery2, (err, personType2Results) => {
                        if (err) throw err;
                        db.query(personTypeQuery3, (err, personType3Results) => {
                            if (err) throw err;
                            res.json({
                                productType: formatProductTypeData(productTypeResults),
                                preferenceReason: formatPreferenceReasonData(preferenceReasonResults),
                                otherFields: formatOtherFieldsData(otherFieldsResults),
                                personType1: formatPersonTypeData1(personType1Results),
                                personType2: formatPersonTypeData2(personType2Results),
                                personType3: formatPersonTypeData3(personType3Results),
                            });
                        });
                    });
                });
            });
        });
    });
});

app.post('/statsPersonType', (req, res) => {
    

    const {type} = req.body
    let param = ''
    if (type) {
        param = ' where product_type = \'' + type + '\'' 
    }

    const personTypeQuery1 = 'SELECT age, count(1) AS count FROM responses a inner join users b on a.user_id = b.id'+ param + ' GROUP BY b.age';
    const personTypeQuery2 = 'SELECT gender, count(1) AS count FROM responses a inner join users b on a.user_id = b.id'+ param + ' GROUP BY b.gender';
    const personTypeQuery3 = 'SELECT country, count(1) AS count FROM responses a inner join users b on a.user_id = b.id'+ param + ' GROUP BY b.country';

    db.query(personTypeQuery1, (err, personType1Results) => {
        if (err) throw err;
        db.query(personTypeQuery2, (err, personType2Results) => {
            if (err) throw err;
            db.query(personTypeQuery3, (err, personType3Results) => {
                if (err) throw err;
                res.json({
                    personType1: formatPersonTypeData1(personType1Results),
                    personType2: formatPersonTypeData2(personType2Results),
                    personType3: formatPersonTypeData3(personType3Results),
                });
            });
        });
    });
})

function formatPersonTypeData1(results) {
    return {
        labels:results.map(item=>item.age),
        values:results.map(item=>item.count)
    };
}
function formatPersonTypeData2(results) {
    return {
        labels:results.map(item=>item.gender),
        values:results.map(item=>item.count)
    };
}
function formatPersonTypeData3(results) {
    return {
        labels:results.map(item=>item.country),
        values:results.map(item=>item.count)
    };
}

function formatProductTypeData(results) {
    return {
        labels:results.map(item=>item.product_type),
        values:results.map(item=>item.count)
    };
    // 处理 productType 数据，返回 labels 和 datasets
}

function formatPreferenceReasonData(results) {
    const preferenceReasons = [
        '价格',
        '质量',
        '环境影响',
        '朋友推荐',
        '品牌声誉',
        '可用性',
        '设计/美学',
        '其他'
    ];

    const counts = preferenceReasons.reduce((acc, reason) => {
        acc[reason] = 0;
        return acc;
    }, {});

    results.forEach(row => {
        const reasons = row.preference_reason.split(',');
        reasons.forEach(reason => {
            if (counts[reason] !== undefined) {
                counts[reason]++;
            }
        });
    });

    return {
        labels: preferenceReasons,
        values: Object.values(counts),
        colors: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FFCD56', '#C9CBCF'
        ]
    };
}

function formatOtherFieldsData(results) {
    const fields = [
        'purchase_frequency',
        'importance_price',
        'importance_quality',
        'importance_environment',
        'importance_brand',
        'importance_design',
        'long_term_value',
        'recommend_friends'
    ];

    const fieldLabels = {
        'purchase_frequency': '购买频率',
        'importance_price': '价格重要性',
        'importance_quality': '质量重要性',
        'importance_environment': '环境重要性',
        'importance_brand': '品牌重要性',
        'importance_design': '设计/美学',
        'long_term_value': '长期价值',
        'recommend_friends': '推荐给朋友'
    };

    const counts = fields.reduce((acc, field) => {
        acc[field] = {
            '非常重要': 0,
            '重要的': 0,
            '中性的': 0,
            '不重要': 0,
            '非常不重要': 0
        };
        return acc;
    }, {});

    results.forEach(row => {
        fields.forEach(field => {
            if (counts[field][row[field]] !== undefined) {
                counts[field][row[field]]++;
            }
        });
    });

    return {
        labels: ['非常重要', '重要的', '中性的', '不重要', '非常不重要'],
        datasets: fields.map((field, index) => ({
            label: fieldLabels[field],
            data: Object.values(counts[field]),
            backgroundColor: `rgba(${index * 40}, ${100 + index * 20}, ${150 + index * 10}, 0.2)`,
            borderColor: `rgba(${index * 40}, ${100 + index * 20}, ${150 + index * 10}, 1)`,
            borderWidth: 1
        }))
    };
}


app.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});
