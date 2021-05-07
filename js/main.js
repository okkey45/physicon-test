'use strict';

const API = 'https://krapipl.imumk.ru:8443/api/mobilev1/update';
const body = document.querySelector('body');
const main = document.querySelector('main');
const selects = document.querySelectorAll('.form__courses select');
const searchGroup = document.querySelector('.search__group');
const searchInput = document.querySelector('.search__input');
const searchListEl = document.querySelector('.search__list');
const searchSubmitBtn = document.querySelector(
	'.form__courses button[type=button]',
);

let items = [];

const setLoader = (params = false) => {
	if (params) {
		body.classList.add('no-scroll');
		main.classList.add('loading');
	} else {
		body.classList.remove('no-scroll');
		main.classList.remove('loading');
	}
};

// Формируем списки для селектов
const createFilter = (items) => {
	selects.forEach((select) => {
		const arr = [];

		if (select.name !== 'grade') {
			let selectEl = document.querySelector(
				`.form__courses select[name=${select.name}]`,
			);

			selectEl.addEventListener('change', changeHandler);

			for (let item of items) {
				if (!arr.includes(item[select.name])) arr.push(item[select.name]);
			}

			for (let option of arr) {
				selectEl.insertAdjacentHTML('beforeend', `<option>${option}</option>`);
			}
		} else if (select.name === 'grade') {
			let selectEl = document.querySelector(
				`.form__courses select[name=${select.name}]`,
			);

			selectEl.addEventListener('change', changeHandler);

			for (let i = 1; i <= 11; i++) {
				selectEl.insertAdjacentHTML('beforeend', `<option>${i}</option>`);
			}
		}
	});
};

// Формируем подсказки для Поиска
const createSearchList = (inputValue = null) => {
	searchListEl.innerHTML = '';
	let arr = [];

	// Фильтруем список
	if (items && inputValue) {
		arr = items.filter((elem) =>
			elem.title.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase()),
		);
	}

	// Формируем список подсказок
	for (let item of arr) {
		searchListEl.insertAdjacentHTML(
			'afterbegin',
			`<li class="search__item" data-id="${item.courseId}" title="${item.title}">${item.title}</li>`,
		);
	}

	// Показываем/скрываем список подсказок
	if (inputValue && inputValue.length > 2 && arr && arr.length > 0) {
		searchListEl.classList.add('show');
	} else {
		searchListEl.classList.remove('show');
	}
};

// Формируем карточку
const createCourse = (item) => {
	let {
		courseId,
		genre,
		grade,
		price,
		priceBonus,
		subject,
		title,
		shopUrl,
	} = item;

	// Проверяем Классы, формируем вывод
	let viewGrade = '';
	let arr = grade.split(';');

	if (arr && +arr.length === 1) {
		viewGrade = `${grade} класс`;
	} else {
		viewGrade = `${arr.shift()}-${arr.pop()} классы`;
	}

	return `
        <div
            class="card course"
            data-id="${courseId}"
            data-subject="${subject}"
            data-genre="${genre}"
            data-grade="${grade}"
        >
            <img src="https://www.imumk.ru/svc/coursecover/55" class="course__img" alt="${title}">
            <div class="card-body course__body">
                <p class="course__title">${subject}</p>
                <p class="course__grade">${viewGrade}</p>
                <p class="course__genre">${genre}</p>
                <a class="course__link" href="${shopUrl}">Подробнее</a>
                <a href="${shopUrl}" class="btn btn-primary">
					<span class="course__price course__priceRub">${price} руб.</span>
					<span class="course__price course__priceBonus d-none">${priceBonus} баллов</span>
				</a>
            </div>
        </div>
    `;
};

// Формируем список карточек и выводим
const renderCourses = (items) => {
	let arr = [];

	for (let item of items) {
		arr.push(createCourse(item));
	}
	if (arr.length > 0) {
		document.querySelector('.courses').innerHTML = arr.join('');

		// Проверяем переключатель отображения цены
		viewPriceHandler(
			document.querySelector('input[name=choosePrice]:checked').id,
		);
	} else {
		document.querySelector(
			'.courses',
		).innerHTML = `Результатов - ${arr.length}. Измените условия поиска.`;

		// Устанавливаем отображения цены в рублях
		viewPriceHandler('priceRub');
	}
};

// Получаем данные
const getData = async (url, method = 'GET', body = null, headers = {}) => {
	setLoader(true);

	if (body) {
		body = JSON.stringify(body);
		headers['Content-Type'] = 'application/json';
	}

	try {
		const response = await fetch(url, { method, body, headers });
		const data = await response.json();

		if (data.result !== 'Ok') {
			throw new Error(data.errorMessage);
		}

		createFilter(data.items);
		createSearchList(data.items);
		renderCourses(data.items);
		items = data.items;

		setLoader(false);
	} catch (error) {
		setLoader(false);
		throw error;
	}
};

// Фильтр данных из Селектов
const filterHandler = (items, elName, elValue) => {
	let arr = [];

	if (elName === 'grade') {
		arr = items.filter((elem) => elem[elName].split(';').includes(elValue));
	} else {
		arr = items.filter((elem) => elem[elName] === elValue);
	}

	return arr;
};

/*
	Получаем данные при изменении в Селектах
	Отрпавляем в фильтр
	Получаем данные из фильтра
	Отдаем массив на вывод списка
*/
const changeHandler = () => {
	let selects = document.querySelectorAll(`select.form-control`);
	let newArr = items;

	for (let el of selects) {
		if (+el.value !== 0) {
			newArr = filterHandler(newArr, el.name, el.value);
		}
	}
	renderCourses(newArr);
};

// Обрабатываем данные из Поиска, отдаем на орисовку списка
const searchHandler = () => {
	if (searchInput && searchInput.value.length > 2) {
		let arr = [];
		let elements = document.querySelectorAll('.search__item');
		elements.forEach((elem) => {
			arr.push(items.find((el) => el.courseId === elem.dataset.id));
		});
		renderCourses(arr);
		createSearchList();
	}
};

// Изменяем вывод цены
const viewPriceHandler = (val) => {
	let itemPriceArr = document.querySelectorAll(`.course__price`);
	let itemPriceChooseArr = document.querySelectorAll(`.course__${val}`);

	if (val) {
		itemPriceArr.forEach((el) => {
			el.classList.add('d-none');
		});
		itemPriceChooseArr.forEach((el) => {
			el.classList.remove('d-none');
		});
	}
};

// Запрос данных
getData(API, 'POST', { data: '' });

// Слушаем инпут Поиска
searchInput.addEventListener('input', (e) => {
	createSearchList(e.target.value);

	if (!e.target.value || (e.target.value && e.target.value.length < 3))
		renderCourses(items);
});

// Слушаем клики
document.addEventListener('click', (e) => {
	// Клик по подсказке в Поиске
	if (e.target.classList.contains('search__item')) {
		e.preventDefault();
		renderCourses(items.filter((el) => el.courseId === e.target.dataset.id));
	}

	// Клик вне инпута Поиска и вне подсказок поиска, чистим поле ввода
	if (searchInput.value && e.target.closest('.search__group') !== searchGroup) {
		e.preventDefault();
		searchInput.value = '';
		createSearchList();
	}

	// Клик по кнопке Поиск
	if (
		e.target === searchSubmitBtn ||
		e.target.closest('button[type=button]') === searchSubmitBtn
	) {
		e.preventDefault();
		searchHandler();
	}

	// Переключатель отображения цены
	if (e.target === e.target.closest('input[name=choosePrice]')) {
		viewPriceHandler(e.target.id);
	}
});

// Слушаем клавиши
document.addEventListener('keydown', (e) => {
	// Если есть данные в поле ввода Поиска
	if (e.key === 'Enter' && searchInput && searchInput.value.length > 2) {
		e.preventDefault();

		searchHandler();
	}
});
