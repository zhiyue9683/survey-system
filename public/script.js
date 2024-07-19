function showSection(sectionId) {
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('basic-info').style.display = 'none';
    document.getElementById('consent').style.display = 'none';
    document.getElementById('survey').style.display = 'none';
    document.getElementById('thank-you').style.display = 'none';
    document.getElementById(sectionId).style.display = 'block';
}

function submitBasicInfo() {
    const form = document.getElementById('basic-info-form');
    const data = {
        age: form.age.value,
        gender: form.gender.value,
        country: form.country.value
    };

    fetch('/basic-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.userId) {
            localStorage.setItem('userId', data.userId);
            showSection('consent');
        }
    });
}

function submitConsent(consent) {
    const userId = localStorage.getItem('userId');
    const data = {
        userId,
        consent: consent ? '同意' : '不同意'
    };

    fetch('/consent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message.includes('opted out')) {
            location.reload(); 
        } else {
            showSection('survey');
        }
    });
}

function submitSurvey() {
    const form = document.getElementById('survey-form');
    const userId = localStorage.getItem('userId');
    const data = {
        userId,
        productType: form.productType.value,
        preferenceReason: Array.from(form.preferenceReason.selectedOptions).map(option => option.value),
        purchaseFrequency: form.purchaseFrequency.value,
        importancePrice: form.importancePrice.value,
        importanceQuality: form.importanceQuality.value,
        importanceEnvironment: form.importanceEnvironment.value,
        importanceBrand: form.importanceBrand.value,
        importanceDesign: form.importanceDesign.value,
        longTermValue: form.longTermValue.value,
        recommendFriends: form.recommendFriends.value
    };

    fetch('/submit-survey', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message.includes('successfully')) {
            showSection('thank-you');
        }
    });
}
