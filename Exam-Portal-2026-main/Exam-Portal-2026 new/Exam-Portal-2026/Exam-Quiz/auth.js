/* ============================================
   PROFESSIONAL AUTH SYSTEM
============================================ */

// Maximum login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 60000; // 1 minute

/* ==========================
   REGISTER
========================== */
async function handleRegister(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector("button[type='submit']");
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner"></span>
        Creating Account...
    `;

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (!Validate.required(name)) {
        resetButton();
        return toast("Please enter your full name.", "error");
    }

    if (!Validate.email(email)) {
        resetButton();
        return toast("Please enter a valid email address.", "error");
    }

    if (UsersDB.findByEmail(email)) {
        resetButton();
        return toast("This email is already registered.", "warning");
    }

    if (password.length < 8) {
        resetButton();
        return toast("Password must be at least 8 characters.", "error");
    }

    if (!/[A-Z]/.test(password))
        return finish("Password must contain one uppercase letter.");

    if (!/[a-z]/.test(password))
        return finish("Password must contain one lowercase letter.");

    if (!/\d/.test(password))
        return finish("Password must contain one number.");

    if (!/[!@#$%^&*]/.test(password))
        return finish("Password must contain one special character.");

    if (password !== confirm) {
        resetButton();
        return toast("Passwords do not match.", "error");
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = UsersDB.add({
        id: Storage.uid(),
        name,
        email,
        password,
        role: "student",
        createdAt: Date.now(),
        lastLogin: null
    });

    Session.login(user);

    toast(`🎉 Welcome ${name}!`, "success");

    setTimeout(() => {
        location.href = "dashboard.html";
    }, 1000);

    function finish(msg) {
        resetButton();
        toast(msg, "error");
    }

    function resetButton() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}


/* ==========================
   LOGIN
========================== */

async function handleLogin(e) {

    e.preventDefault();

    const submitBtn = e.target.querySelector("button[type='submit']");
    const original = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner"></span>
        Signing In...
    `;

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember")?.checked;

    if (!Validate.email(email))
        return finish("Enter a valid email.");

    if (password.length < 6)
        return finish("Password is too short.");

    let attempts = Storage.get("login_attempts", 0);
    let lockTime = Storage.get("lock_time", 0);

    if (Date.now() < lockTime) {

        const seconds = Math.ceil((lockTime - Date.now()) / 1000);

        return finish(`Too many attempts. Try again in ${seconds}s`);
    }

    const user = UsersDB.findByEmail(email);

    if (!user || user.password !== password) {

        attempts++;

        Storage.set("login_attempts", attempts);

        if (attempts >= MAX_LOGIN_ATTEMPTS) {

            Storage.set("lock_time", Date.now() + LOCK_TIME);
            Storage.set("login_attempts", 0);

            return finish("Account temporarily locked for 1 minute.");
        }

        return finish(`Invalid credentials. ${MAX_LOGIN_ATTEMPTS - attempts} attempts left.`);
    }

    Storage.remove("login_attempts");
    Storage.remove("lock_time");

    UsersDB.update(user.id, { lastLogin: Date.now() });

    Session.login(user);

    if (remember)
        Storage.set(DB_KEYS.REMEMBER, email);
    else
        Storage.remove(DB_KEYS.REMEMBER);

    toast(`Welcome back ${user.name}!`, "success");

    await new Promise(resolve => setTimeout(resolve, 800));

    location.href =
        user.role === "admin"
            ? "admin.html"
            : "dashboard.html";

    function finish(msg) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
        toast(msg, "error");
    }

}


/* ==========================
   REMEMBER EMAIL
========================== */

function prefillRemembered() {

    const remembered = Storage.get(DB_KEYS.REMEMBER);

    const emailInput = document.getElementById("email");
    const remember = document.getElementById("remember");

    if (remembered && emailInput) {

        emailInput.value = remembered;

        if (remember)
            remember.checked = true;
    }
}


/* ==========================
   AUTO REDIRECT
========================== */

(function () {

    const user = Session.current?.();

    if (!user) return;

    const page = location.pathname.split("/").pop();

    if (page === "index.html" || page === "login.html") {

        location.href =
            user.role === "admin"
                ? "admin.html"
                : "dashboard.html";
    }

})();


/* ==========================
   PASSWORD STRENGTH
========================== */

const passwordField = document.getElementById("password");

if (passwordField) {

    passwordField.addEventListener("input", function () {

        const value = this.value;

        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[!@#$%^&*]/.test(value)) score++;

        const levels = [
            "Very Weak",
            "Weak",
            "Medium",
            "Strong",
            "Very Strong",
            "Excellent"
        ];

        const colors = [
            "#ff4d4d",
            "#ff7043",
            "#ffb300",
            "#29b6f6",
            "#00c853",
            "#00e676"
        ];

        let indicator = document.getElementById("password-strength");

        if (!indicator) {

            indicator = document.createElement("div");

            indicator.id = "password-strength";

            indicator.style.marginTop = "8px";
            indicator.style.fontWeight = "600";

            this.parentNode.appendChild(indicator);
        }

        indicator.innerHTML = levels[score];
        indicator.style.color = colors[score];

    });

}
