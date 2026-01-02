// API Base URL
const API_URL = window.location.origin + '/api';

// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tab).classList.add('active');
    });
});

// Load faculties
async function loadFaculties() {
    try {
        const response = await fetch(`${API_URL}/auth/faculties`);
        const data = await response.json();
        
        const select = document.getElementById('registerFaculty');
        data.faculties.forEach(faculty => {
            const option = document.createElement('option');
            option.value = faculty;
            option.textContent = faculty;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading faculties:', error);
    }
}

loadFaculties();

// Get verification questions
let verificationQuestions = [];

document.getElementById('getVerificationBtn').addEventListener('click', async () => {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const faculty = document.getElementById('registerFaculty').value;
    const degree = document.getElementById('registerDegree').value;
    const course = document.getElementById('registerCourse').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !phone || !faculty || !degree || !course || !password) {
        showError('registerError', 'Bütün sahələr doldurulmalıdır');
        return;
    }
    
    if (password.length < 6) {
        showError('registerError', 'Şifrə ən azı 6 simvoldan ibarət olmalıdır');
        return;
    }
    
    if (!/^[0-9]{9}$/.test(phone)) {
        showError('registerError', 'Telefon nömrəsi 9 rəqəmdən ibarət olmalıdır');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/verification-questions`);
        const data = await response.json();
        
        verificationQuestions = data.questions;
        displayVerificationQuestions(data.questions);
        
        document.getElementById('getVerificationBtn').style.display = 'none';
        document.getElementById('submitRegisterBtn').style.display = 'block';
        document.getElementById('verificationSection').style.display = 'block';
        document.getElementById('registerError').style.display = 'none';
    } catch (error) {
        showError('registerError', 'Xəta baş verdi');
    }
});

function displayVerificationQuestions(questions) {
    const container = document.getElementById('verificationQuestions');
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'verification-question';
        
        const questionText = document.createElement('p');
        questionText.textContent = `${index + 1}. ${q.question}`;
        questionDiv.appendChild(questionText);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'verification-options';
        
        q.options.forEach(option => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'verification-option';
            optionDiv.textContent = option;
            optionDiv.dataset.questionId = q.id;
            optionDiv.dataset.answer = option;
            
            optionDiv.addEventListener('click', () => {
                // Deselect other options for this question
                optionsDiv.querySelectorAll('.verification-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionDiv.classList.add('selected');
            });
            
            optionsDiv.appendChild(optionDiv);
        });
        
        questionDiv.appendChild(optionsDiv);
        container.appendChild(questionDiv);
    });
}

// Register form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value + '@bsu.edu.az';
    const phone = '+994' + document.getElementById('registerPhone').value;
    const faculty = document.getElementById('registerFaculty').value;
    const degree = document.getElementById('registerDegree').value;
    const course = document.getElementById('registerCourse').value;
    const password = document.getElementById('registerPassword').value;
    
    // Get verification answers
    const selectedOptions = document.querySelectorAll('.verification-option.selected');
    if (selectedOptions.length !== 3) {
        showError('registerError', 'Bütün sualları cavablandırmalısınız');
        return;
    }
    
    const verificationAnswers = Array.from(selectedOptions).map(option => ({
        questionId: parseInt(option.dataset.questionId),
        answer: option.dataset.answer
    }));
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                phone,
                faculty,
                degree,
                course: parseInt(course),
                password,
                verificationAnswers
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/chat';
        } else {
            showError('registerError', data.error);
        }
    } catch (error) {
        showError('registerError', 'Xəta baş verdi');
    }
});

// Login form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value + '@bsu.edu.az';
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/chat';
        } else {
            showError('loginError', data.error);
        }
    } catch (error) {
        showError('loginError', 'Xəta baş verdi');
    }
});

// Admin login form
document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('admin', JSON.stringify(data.admin));
            window.location.href = '/admin';
        } else {
            showError('adminError', data.error);
        }
    } catch (error) {
        showError('adminError', 'Xəta baş verdi');
    }
});

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('show');
    errorElement.style.display = 'block';
    
    setTimeout(() => {
        errorElement.classList.remove('show');
        errorElement.style.display = 'none';
    }, 5000);
}
