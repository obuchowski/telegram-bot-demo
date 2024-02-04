import categories from './categories.json';

export default async function submitToGoogleForm(amount, categoryLabel, comment) {
  const params = {
    'entry.227094824': 'Расход',
    'entry.2094389336': amount,

    // 'entry.1364109338': '__other_option__',
    // 'entry.1364109338.other_option_response': 'Salary',
  };

  const category = categories.flat().find(c => c.label === categoryLabel);
  if (category.daily) {
    params['entry.1258243425'] = category.name;
  } else {
    params['entry.1793636883'] = category.name;
  }

  if (category.comment) {
    comment = comment ? `${category.comment}; ${comment}` : category.comment;
  }
  params['entry.1581230239'] = comment;

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.append(key, value));

  try {
    const response = await fetch(process.env.FORM_URL, {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok) {
      console.log('Form submitted successfully');
      return true;
    } else {
      console.error('Form submission failed', response.statusText);
    }
  } catch (error) {
    console.error('Error submitting form', error);
  }
}