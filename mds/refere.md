refere.md

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Referral Sheet – Homicho Ammunation Engineering Industry Health Center</title>
<style>
  :root {
    --ink: #111;
    --paper: #ffffff;
    --desk: #e9eef0;
    --rule: #222;
    --hint: #8a9399;
    --focus: #1a56c4;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    background: var(--desk);
    color: var(--ink);
    font-family: "Times New Roman", Times, "Liberation Serif", serif;
    font-size: 16px;
    line-height: 1.3;
    padding: 24px 12px 48px;
  }

.sheet {
max-width: 800px;
margin: 0 auto;
background: var(--paper);
padding: 40px 48px 44px;
box-shadow: 0 1px 6px rgba(0,0,0,.18);
}

/_ Header _/
.header { text-align: center; margin-bottom: 18px; }
.header .am { font-size: 17px; font-weight: 700; line-height: 1.35; }
.header .en { font-size: 17px; font-weight: 700; letter-spacing: .01em; line-height: 1.35; }
.header .am + .en { margin-top: 6px; }
.title {
display: inline-block;
margin: 22px 0 0;
font-size: 30px;
font-weight: 700;
letter-spacing: .04em;
border-bottom: 3px solid var(--ink);
padding-bottom: 1px;
}

/_ Rows _/
form { margin-top: 26px; }
.row { display: flex; gap: 22px; align-items: flex-end; margin-bottom: 20px; }
.field { display: flex; align-items: flex-end; gap: 8px; flex: 1 1 0; min-width: 0; }
.field.wide { flex: 2 1 0; }
.field.narrow { flex: .6 1 0; }
label { font-weight: 700; white-space: nowrap; font-size: 15px; letter-spacing: .02em; }
input[type="text"], input[type="number"], input[type="date"], select {
flex: 1;
min-width: 0;
font: inherit;
font-size: 16px;
color: var(--ink);
background: transparent;
border: 0;
border-bottom: 1.5px solid var(--rule);
border-radius: 0;
padding: 2px 4px;
outline: none;
appearance: none;
-webkit-appearance: none;
}
select { background: transparent; }

input:focus, textarea:focus, select:focus {
border-bottom-color: var(--focus);
box-shadow: 0 2px 0 0 var(--focus);
}

/_ Ruled text areas _/
.block { margin-bottom: 22px; }
.block > label { display: block; margin-bottom: 2px; }
textarea {
display: block;
width: 100%;
font: inherit;
font-size: 16px;
color: var(--ink);
background-image: repeating-linear-gradient(
to bottom,
transparent 0, transparent 31px,
var(--rule) 31px, var(--rule) 32px
);
background-attachment: local;
border: 0;
line-height: 32px;
padding: 0 4px;
resize: vertical;
outline: none;
overflow: hidden;
}
textarea.l2 { height: 64px; }
textarea.l3 { height: 96px; }
textarea.l4 { height: 128px; }

.signoff { margin-top: 30px; }

.actions {
max-width: 800px;
margin: 16px auto 0;
display: flex;
gap: 10px;
justify-content: flex-end;
}
button {
font: inherit;
font-size: 15px;
padding: 9px 18px;
border: 1.5px solid var(--ink);
background: var(--paper);
color: var(--ink);
cursor: pointer;
}
button.primary { background: var(--ink); color: #fff; }
button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

::placeholder { color: var(--hint); opacity: 1; font-size: 14px; font-style: italic; }

@media (max-width: 640px) {
.sheet { padding: 26px 18px 30px; }
.row { flex-direction: column; align-items: stretch; gap: 16px; }
.title { font-size: 25px; }
.header .am, .header .en { font-size: 15px; }
}

@media print {
@page { size: A4; margin: 14mm; }
body { background: #fff; padding: 0; }
.sheet { box-shadow: none; padding: 0; max-width: none; }
.actions { display: none; }
::placeholder { color: transparent; }
input, textarea, select { border-color: #000; }
select { background: none; }
}
</style>

</head>
<body>

<main class="sheet">
  <header class="header">
    <div class="am">የመከላከያ ኢንጂነሪንግ ኢንዱስትሪዎች ግሩፕ</div>
    <div class="am">ሆሚጮ ጥይት ኢንጂነሪንግ ኢንዱስትሪ ጤና ጣቢያ</div>
    <div class="en">DEFENCE ENGINEERING INDUSTRIES GROUP</div>
    <div class="en">HOMICHO AMMUNATION ENGINEERING INDUSTRY HEALTH CENTER</div>
    <h1 class="title">REFERAL SHEET</h1>
  </header>

  <form id="referral" autocomplete="off">
    <div class="row">
      <div class="field wide">
        <label for="name">NAME</label>
        <input type="text" id="name" name="name" placeholder="Full name of patient">
      </div>
      <div class="field narrow">
        <label for="age">AGE</label>
        <input type="number" id="age" name="age" min="0" max="120" placeholder="Years">
      </div>
      <div class="field narrow">
        <label for="sex">SEX</label>
        <select id="sex" name="sex">
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>
    </div>

    <div class="row">
      <div class="field wide">
        <label for="unit">UNIT</label>
        <input type="text" id="unit" name="unit" placeholder="Department or unit">
      </div>
      <div class="field">
        <label for="rank">RANK</label>
        <input type="text" id="rank" name="rank" placeholder="Rank or position">
      </div>
    </div>

    <div class="row">
      <div class="field">
        <label for="from">REFERRED FROM</label>
        <input type="text" id="from" name="referred_from" placeholder="Facility or clinician">
      </div>
      <div class="field">
        <label for="to">REFERRED TO</label>
        <input type="text" id="to" name="referred_to" placeholder="Facility or specialist">
      </div>
    </div>

    <div class="block">
      <label for="history">BRIEF HISTORY AND PHYSICAL FINDINGS</label>
      <textarea id="history" name="history_physical" class="l4" placeholder="Presenting complaint, history, examination findings"></textarea>
    </div>

    <div class="block">
      <label for="lab">LAB AND X-RAY FINDINGS</label>
      <textarea id="lab" name="lab_xray" class="l3" placeholder="Laboratory and imaging results"></textarea>
    </div>

    <div class="block">
      <label for="diagnosis">DIAGNOSIS</label>
      <textarea id="diagnosis" name="diagnosis" class="l3" placeholder="Working or confirmed diagnosis"></textarea>
    </div>

    <div class="block">
      <label for="treatment">TREATMENT GIVEN</label>
      <textarea id="treatment" name="treatment" class="l3" placeholder="Drugs, doses and procedures given"></textarea>
    </div>

    <div class="block">
      <label for="recommendation">RECOMMENDATION</label>
      <textarea id="recommendation" name="recommendation" class="l3" placeholder="Reason for referral and care requested"></textarea>
    </div>

    <div class="row signoff">
      <div class="field wide">
        <label for="dr">Dr.</label>
        <input type="text" id="dr" name="doctor" placeholder="Referring doctor's name and signature">
      </div>
      <div class="field">
        <label for="date">Date</label>
        <input type="date" id="date" name="date">
      </div>
    </div>

  </form>
</main>

<div class="actions">
  <button type="button" id="clear">Clear form</button>
  <button type="button" class="primary" id="print">Print</button>
</div>

<script>
  document.getElementById('print').addEventListener('click', function () { window.print(); });
  document.getElementById('clear').addEventListener('click', function () {
    document.getElementById('referral').reset();
  });
  // Default the date to today; the person can change it.
  var d = document.getElementById('date');
  var t = new Date();
  d.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
</script>
</body>
</html>
