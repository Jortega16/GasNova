//-------------------------------------------------------------------------------------
function localizeString(stringToLocalize) {
    switch(stringToLocalize) {

        // General use
        case "PTS_2_CONTROLLER":
            if (LANGUAGE == "RU") {return "Контроллер PTS-2";}
            else if (LANGUAGE == "TR") {return "PTS-2 Otomasyon";}
            else {return "PTS-2 controller";}

        case "CONTROLLER":
            if (LANGUAGE == "RU") {return "Контроллер";}
            else if (LANGUAGE == "TR") {return "Otomasyon";}
            else {return "Controller";}            

        case "GET":
            if (LANGUAGE == "RU") {return "Считать";} 
            else if (LANGUAGE == "TR") {return "Al";} 
            else {return "Get";}

        case "SET":
            if (LANGUAGE == "RU") {return "Записать";} 
            else if (LANGUAGE == "TR") {return "Ayarla";} 
            else {return "Set";}

        case "SET_DEFAULT":
            if (LANGUAGE == "RU") {return "Записать по-умолчанию";} 
            else if (LANGUAGE == "TR") {return "Varsayılan olarak ayarla";} 
            else {return "Set default";}
            
        case "LOGOUT":
            if (LANGUAGE == "RU") {return "Выход";} 
            else if (LANGUAGE == "TR") {return "Çıkış";} 
            else {return "Logout";}
            
        case "DEVELOPED_BY":
            if (LANGUAGE == "RU") {return "разработан";} 
            else if (LANGUAGE == "TR") {return "tarafından geliştirilmiş";} 
            else {return "developed by";}
            
        case "TECHNOTRADE_LLC":
            if (LANGUAGE == "RU") {return "ООО 'Технотрейд'";} 
            else if (LANGUAGE == "TR") {return "Technotrade LLC'";} 
            else {return "Technotrade LLC";}
            
        case "TECHNOTRADE_WEBSITE_ADDRESS":
            if (LANGUAGE == "RU") {return "https://www.technotrade.ua";} 
            else if (LANGUAGE == "TR") {return "https://www.technotrade.ua";} 
            else {return "https://www.technotrade.ua/en";}
            
        case "DIALOG_LOGOUT_LABEL":
            if (LANGUAGE == "RU") {return "Готовы завершить работу?";} 
            else if (LANGUAGE == "TR") {return "Sayfadan ayrılmak istiyor musunuz?";} 
            else {return "Ready to Leave?";}
            
        case "DIALOG_LOGOUT_TEXT":
            if (LANGUAGE == "RU") {return "Нажмите 'Завершить работу' ниже для завершения текущей сессии.";} 
            else if (LANGUAGE == "TR") {return "Oturumunuzu sonlandırmak için 'Çıkış'ı seçiniz.";} 
            else {return "Select 'Logout' below if you are ready to end your current session.";}
            
        case "CANCEL":
            if (LANGUAGE == "RU") {return "Отмена";} 
            else if (LANGUAGE == "TR") {return "İptal";} 
            else {return "Cancel";}

        case "PTS_2_CONTROLLER_WEB_SERVER":
            if (LANGUAGE == "RU") {return "Веб-сервер контроллера PTS-2";} 
            else if (LANGUAGE == "TR") {return "PTS-2 Web-Sunucusu";} 
            else {return "PTS-2 controller web-server";}

        case "WEB_SERVER":
            if (LANGUAGE == "RU") {return "Веб сервер";} 
            else if (LANGUAGE == "TR") {return "Web sunucusu";} 
            else {return "Web server";}

        case "ERROR":
            if (LANGUAGE == "RU") {return "Ошибка";} 
            else if (LANGUAGE == "TR") {return "Hata";} 
            else {return "Error";}

        case "ERRORS":
            if (LANGUAGE == "RU") {return "Ошибка";} 
            else if (LANGUAGE == "TR") {return "Hata";} 
            else {return "Error(s)";}

        case "SD_HAS_ERROR":
            if (LANGUAGE == "RU") {return "Ошибка карты памяти!";} 
            else if (LANGUAGE == "TR") {return "SD'de hata let!";} 
            else {return "SD has error!";}

        case "DO_YOU_REALLY_WANT_TO_DELETE_FILE":
            if (LANGUAGE == "RU") {return "Вы действительно хотите удалить файл";} 
            else if (LANGUAGE == "TR") {return "Dosyayı gerçekten silmek istiyor musunuz?";} 
            else {return "Do you really want to delete file";}

        case "DOWNLOAD":
            if (LANGUAGE == "RU") {return "загрузить";} 
            else if (LANGUAGE == "TR") {return "indir";} 
            else {return "download";}

        case "CONFIGURATION_CHANGED_SWITCH_TAB_WITHOUT_SAVING":
            if (LANGUAGE == "RU") {return "Конфигурация была изменена. Вы действительно хотите переключить вкладку без сохранения?";} 
            else if (LANGUAGE == "TR") {return "Kaydedilmemiş ayarlarınız let.Kaydetmeden devam etmek istiyor musunuz?";} 
            else {return "Configuration was changed. Do you really want to switch the tab without saving?";}

        case "DESCRIPTION":
            if (LANGUAGE == "RU") {return "Описание";} 
            else if (LANGUAGE == "TR") {return "Açıklama";} 
            else {return "Description";}

        case "DEFAULT":
            if (LANGUAGE == "RU") {return "По\u2011умолчанию";} 
            else if (LANGUAGE == "TR") {return "Varsayılan";} 
            else {return "Default";}

        case "VALUE":
            if (LANGUAGE == "RU") {return "Значение";} 
            else if (LANGUAGE == "TR") {return "Değer";} 
            else {return "Value";}

        case "NAME":
            if (LANGUAGE == "RU") {return "Наименование";} 
            else if (LANGUAGE == "TR") {return "Ad";} 
            else {return "Name";}

        case "SHOULD_CONTAIN":
            if (LANGUAGE == "RU") {return "должен(-на) содержать";} 
            else if (LANGUAGE == "TR") {return "içermeli";} 
            else {return "should contain";}

        case "ONLY_ALPHANUMERIC_SYMBOLS":
            if (LANGUAGE == "RU") {return "только цифробуквенные символы (латинские буквы и арабские цифры)";} 
            else if (LANGUAGE == "TR") {return "sadece alfanümerik semboller (Latin harfleri ve Arap rakamları)";} 
            else {return "only alphanumeric symbols (Latin letters and Arabic numerals)";}

        case "ONLY_ALPHANUMERIC_AND_SPECIAL_SYMBOLS":
            if (LANGUAGE == "RU") {return "только цифробуквенные (латинские буквы и арабские цифры) и специальные символы";} 
            else if (LANGUAGE == "TR") {return "sadece alfanümerik (Latin harfleri ve Arap rakamları) ve özel semboller";} 
            else {return "only alphanumeric (Latin letters and Arabic numerals) and special symbols";}

        case "SYMBOLS_MAXIMUM":
            if (LANGUAGE == "RU") {return "символов максимум";} 
            else if (LANGUAGE == "TR") {return "maksimum karakter";} 
            else {return "symbols maximum";}

        case "ONLY_NUMERIC_SYMBOLS_AND_DOT":
            if (LANGUAGE == "RU") {return "только цифры и точку в качестве десятичного разделителя (при необходимости)";} 
            else if (LANGUAGE == "TR") {return "sadece sayısal karakter ve";} 
            else {return "only numeric symbols and dot as decimal separator (when required)";}

        case "IS_NOT_VALID":
            if (LANGUAGE == "RU") {return "не является допустимым";} 
            else if (LANGUAGE == "TR") {return "geçerli değil";} 
            else {return "is not valid";}

        case "IS_NOT_SET":
            if (LANGUAGE == "RU") {return "не установлен(а)";} 
            else if (LANGUAGE == "TR") {return "ayarlanmadı";} 
            else {return "is not set";}

        case "SHOULD_BE_LESSER_THAN":
            if (LANGUAGE == "RU") {return "должен(-на) быть менее чем";} 
            else if (LANGUAGE == "TR") {return "daha az olmalı";} 
            else {return "should be lesser than";}

        case "SHOULD_BE_BIGGER_THAN":
            if (LANGUAGE == "RU") {return "должен(-на) быть более чем";} 
            else if (LANGUAGE == "TR") {return "daha büyük olmalı";} 
            else {return "should be bigger than";}

        case "MUST_BE_A_NUMBER":
            if (LANGUAGE == "RU") {return "должен(-на) быть числом";} 
            else if (LANGUAGE == "TR") {return "sayı olmalı";} 
            else {return "must be a number";}

        case "MUST_BE_BETWEEN":
            if (LANGUAGE == "RU") {return "должен(-на) иметь значение между";} 
            else if (LANGUAGE == "TR") {return "arasında olmalı";} 
            else {return "must be between";}

        case "AND":
            if (LANGUAGE == "RU") {return "и";} 
            else if (LANGUAGE == "TR") {return "ve";} 
            else {return "and";}

        case "MUST_BE_POSITIVE":
            if (LANGUAGE == "RU") {return "должен(-на) иметь положительное значение";} 
            else if (LANGUAGE == "TR") {return "pozitif değer olmalı";} 
            else {return "must be positive";}

        case "MUST_BE_NON_NEGATIVE":
            if (LANGUAGE == "RU") {return "должен(-на) иметь неотрицательное значение";} 
            else if (LANGUAGE == "TR") {return "negatif değer olmamalı";} 
            else {return "must be non negative";}

        case "SHOULD_HAVE_LENGTH":
            if (LANGUAGE == "RU") {return "должен(-на) иметь длину";} 
            else if (LANGUAGE == "TR") {return "uzunluk değeri olmalı";} 
            else {return "should have length";}

        case "BETWEEN":
            if (LANGUAGE == "RU") {return "между";} 
            else if (LANGUAGE == "TR") {return "arasında";} 
            else {return "between";}

        case "HEXADECIMAL_CHARACTERS":
            if (LANGUAGE == "RU") {return "шестнадцатеричных символов";} 
            else if (LANGUAGE == "TR") {return "onaltılık karakterler";} 
            else {return "hexadecimal characters";}

        case "CHARACTERS":
            if (LANGUAGE == "RU") {return "символов";} 
            else if (LANGUAGE == "TR") {return "karakter";} 
            else {return "characters";}

        case "IS_PRESENT":
            if (LANGUAGE == "RU") {return "Присутствует";} 
            else if (LANGUAGE == "TR") {return "Mevcut";} 
            else {return "Present";}

        case "IS_ABSENT":
            if (LANGUAGE == "RU") {return "Отсутствует";} 
            else if (LANGUAGE == "TR") {return "Mevcut değil";} 
            else {return "Not present";}

        case "NONE":
            if (LANGUAGE == "RU") {return "Нет";} 
            else if (LANGUAGE == "TR") {return "Yok";} 
            else {return "None";}

        case "MINE":
            if (LANGUAGE == "RU") {return "Свои";} 
            else if (LANGUAGE == "TR") {return "Sadece Ben";} 
            else {return "Mine";}

        case "ALL":
            if (LANGUAGE == "RU") {return "Все";} 
            else if (LANGUAGE == "TR") {return "Hepsi";} 
            else {return "All";}

        case "YES":
            if (LANGUAGE == "RU") {return "Да";} 
            else if (LANGUAGE == "TR") {return "Evet";} 
            else {return "Yes";}

        case "NO":
            if (LANGUAGE == "RU") {return "Нет";}
            else if (LANGUAGE == "TR") {return "Нayır";} 
            else {return "No";}

        case "IDLE":
            if (LANGUAGE == "RU") {return "Останов";} 
            else if (LANGUAGE == "TR") {return "Boşta";}
            else {return "Idle";}

        case "NOZZLE":
            if (LANGUAGE == "RU") {return "Пистолет";} 
            else if (LANGUAGE == "TR") {return "Tabanca";} 
            else {return "Nozzle";}

        case "NOZZLE_SHORT":
            if (LANGUAGE == "RU") {return "Пист.";} 
            else if (LANGUAGE == "TR") {return "Tabanca.";} 
            else {return "Nozzle";}

        case "FILLING":
            if (LANGUAGE == "RU") {return "Налив";} 
            else if (LANGUAGE == "TR") {return "Dolum";}
            else {return "Filling";}

        case "OFFLINE":
            if (LANGUAGE == "RU") {return "Выкл.";} 
            else if (LANGUAGE == "TR") {return "Çevrimdışı.";} 
            else {return "Offline";}

        case "NO_CONNECTION":
            if (LANGUAGE == "RU") {return "Нет связи";} 
            else if (LANGUAGE == "TR") {return "Bağlantı Yok";} 
            else {return "No connection";}

        case "CONFIGURATION_FILE_NOT_FOUND":
            if (LANGUAGE == "RU") {return "Не найдено файл pts_config_ru.js";} 
            else if (LANGUAGE == "TR") {return "pts_config_ru.js dosyası yok";} 
            else {return "pts_config_en.js file is not present!";}

        case "AJAX_TIMEOUT_EXPIRED":
            if (LANGUAGE == "RU") {return "Истек таймаут AJAX!";} 
            else if (LANGUAGE == "TR") {return "AJAX zamanaşımı aşıldı!";}
            else {return "AJAX timeout expired!";}

        case "WRONG_FILE_NAME_FILE_NAME_SHOULD_BE":
            if (LANGUAGE == "RU") {return "Указано некорректное наименование файла, оно должно быть";} 
            else if (LANGUAGE == "TR") {return "Yanlış dosya adı, dosya adı";}
            else {return "Wrong file name, file name should be";}

        case "CREATE":
            if (LANGUAGE == "RU") {return "Создать";} 
            else if (LANGUAGE == "TR") {return "Oluşturmak";}
            else {return "Create";}

        case "CREATE_RECORD":
            if (LANGUAGE == "RU") {return "Создать запись";} 
            else if (LANGUAGE == "TR") {return "Kayıt oluştur";}
            else {return "Create record";}

        case "EDIT":
            if (LANGUAGE == "RU") {return "Изменить";} 
            else if (LANGUAGE == "TR") {return "Düzenlemek";}
            else {return "Edit";}

        case "EDIT_RECORD":
            if (LANGUAGE == "RU") {return "Изменить запись";} 
            else if (LANGUAGE == "TR") {return "Kaydı düzenle";}
            else {return "Edit record";}

        case "DELETE":
            if (LANGUAGE == "RU") {return "Удалить";} 
            else if (LANGUAGE == "TR") {return "Silmek";}
            else {return "Delete";}

        case "DELETE_RECORD":
            if (LANGUAGE == "RU") {return "Удалить запись";} 
            else if (LANGUAGE == "TR") {return "Kaydı sil";}
            else {return "Delete record";}

        case "REALLY_WANT_TO_DELETE_N_RECORDS":
            if (LANGUAGE == "RU") {return "Вы точно хотите удалить %d записей?";} 
            else if (LANGUAGE == "TR") {return "Gerçekten %d kaydı silmek istiyor musunuz?";}
            else {return "Do you really want to delete %d records?";}

        case "REALLY_WANT_TO_DELETE_1_RECORD":
            if (LANGUAGE == "RU") {return "Вы точно хотите удалить 1 запись?";} 
            else if (LANGUAGE == "TR") {return "Gerçekten 1 kaydı silmek istiyor musunuz?";}
            else {return "Do you really want to delete 1 record?";}

        case "ERROR_OCCURED":
            if (LANGUAGE == "RU") {return "Возникла системная ошибка";} 
            else if (LANGUAGE == "TR") {return "Sistem hatası oluştu";}
            else {return "System error occured";}

        case "ONLINE":
            if (LANGUAGE == "RU") {return "Онлайн";} 
            else if (LANGUAGE == "TR") {return "İnternet üzerinden";}
            else {return "Online";}


        // Device Information page
        case "TAB_DEVICE_INFORMATION":
            if (LANGUAGE == "RU") {return "Информация об устройстве";} 
            else if (LANGUAGE == "TR") {return "Cihaz Bilgileri";} 
            else {return "Device information";}

        case "VER":
            if (LANGUAGE == "RU") {return "Вер.";} 
            else if (LANGUAGE == "TR") {return "Ver.";} 
            else {return "Ver.";}

        case "SD_ERROR_FOUND":
            if (LANGUAGE == "RU") {return "Ошибка SD-карты!";} 
            else if (LANGUAGE == "TR") {return "SD Kart hatası!";} 
            else {return "SD flash disk error!";}

        case "TASK":
            if (LANGUAGE == "RU") {return "Задача";} 
            else if (LANGUAGE == "TR") {return "Görev";} 
            else {return "Task";}

        case "PRIORITY":
            if (LANGUAGE == "RU") {return "Приоритет";} 
            else if (LANGUAGE == "TR") {return "Öncelik";} 
            else {return "Priority";}

        case "STATE":
            if (LANGUAGE == "RU") {return "Состояние";} 
            else if (LANGUAGE == "TR") {return "Durum";} 
            else {return "State";}

        case "STACK_HIGH_WATERMARK":
            if (LANGUAGE == "RU") {return "Метка стэка";}
            else if (LANGUAGE == "TR") {return "Stack etiketi";}  
            else {return "High watermark";}

        case "RUN_TIME_COUNTER_MS":
            if (LANGUAGE == "RU") {return "Время работы, мс";} 
            else if (LANGUAGE == "TR") {return "Çalışma süresi, ms";} 
            else {return "Run time counter, ms";}

        case "CURRENT_HEAP_FREE_SIZE":
            if (LANGUAGE == "RU") {return "Свободный объем памяти heap";} 
            else if (LANGUAGE == "TR") {return "Kullanılabilir Heap Boyutu";} 
            else {return "Current heap free size";}

        case "MINIMAL_HEAP_FREE_SIZE":
            if (LANGUAGE == "RU") {return "Минимальный объем памяти heap";}
            else if (LANGUAGE == "TR") {return "Minimum kullanılabilir Heap boyutu ";}  
            else {return "Minimal heap free size";}

        case "TOTAL_RUN_TIME_MS":
            if (LANGUAGE == "RU") {return "Общее время работы, мс";}
            else if (LANGUAGE == "TR") {return "Toplam çalışma süresi, ms";}  
            else {return "Total run time, ms";}

        case "SYSTEM_UP_TIME":
            if (LANGUAGE == "RU") {return "Время работы";}
            else if (LANGUAGE == "TR") {return "Sistem çalışma süresi";} 
            else {return "System up time";}

        case "RELEASE_DATETIME":
            if (LANGUAGE == "RU") {return "Дата выпуска";} 
            else if (LANGUAGE == "TR") {return "Yazılım versiyonu tarih/saat";}
            else {return "Release date/time";}

        case "BATTERY_VOLTAGE":
            if (LANGUAGE == "RU") {return "Напряжение батареи";} 
            else if (LANGUAGE == "TR") {return "Batarya Voltajı";} 
            else {return "Battery voltage";}

        case "MV":
            if (LANGUAGE == "RU") {return "мВ";} 
            else if (LANGUAGE == "TR") {return "mV";} 
            else {return "mV";}

        case "NO_BATTERY_FOUND_PLEASE_PLACE_BATTERY":
            if (LANGUAGE == "RU") {return "Отсутствует батарея. Пожалуйста, вставьте батарею!";} 
            else if (LANGUAGE == "TR") {return "Batarya bulunamadı.Lütfen yeni batarya takınız!";} 
            else {return "No battery found. Please insert a battery!";}

        case "BATTERY_IS_OK":
            if (LANGUAGE == "RU") {return "Батарея в порядке.";} 
            else if (LANGUAGE == "TR") {return "Batarya tamam.";} 
            else {return "Battery is OK.";}

        case "BATTERY_NEEDS_REPLACEMENT_SOON":
            if (LANGUAGE == "RU") {return "Заряд батареи снижается, скоро потребуется замена.";} 
            else if (LANGUAGE == "TR") {return "Batarya bitmek üzere.Kısa süre içerisinde değiştirmeniz gerekiyor.";} 
            else {return "Battery is coming to low, needs replacement soon.";}

        case "BATTERY_DISCHARGED_ERROR":
            if (LANGUAGE == "RU") {return "Батарея разряжена, требуется заменить батарею!";} 
            else if (LANGUAGE == "TR") {return "Batarya bitti.Lütfen yenisi ile değiştiriniz";} 
            else {return "Battery is discharged, please replace it immediately!";}

        case "DAYS":
            if (LANGUAGE == "RU") {return "дней";} 
            else if (LANGUAGE == "TR") {return "gün";} 
            else {return "days";}

        case "HOURS":
            if (LANGUAGE == "RU") {return "часов";} 
            else if (LANGUAGE == "TR") {return "saat";} 
            else {return "hours";}

        case "MINUTES":
            if (LANGUAGE == "RU") {return "минут";} 
            else if (LANGUAGE == "TR") {return "dakika";} 
            else {return "minutes";}

        case "SECONDS":
            if (LANGUAGE == "RU") {return "секунд";} 
            else if (LANGUAGE == "TR") {return "saniye";}
            else {return "seconds";}

        case "USED_MEMORY":
            if (LANGUAGE == "RU") {return "Использовано памяти";} 
            else if (LANGUAGE == "TR") {return "Bellek kullanımı";} 
            else {return "Used memory";}

        case "FREE_MEMORY":
            if (LANGUAGE == "RU") {return "Свободно памяти";} 
            else if (LANGUAGE == "TR") {return "Kullanılabilir Bellek";} 
            else {return "Free memory";}

        case "TOTAL_MEMORY":
            if (LANGUAGE == "RU") {return "Всего памяти";} 
            else if (LANGUAGE == "TR") {return "Toplam Bellek";}
            else {return "Total memory";}

        case "FILES":
            if (LANGUAGE == "RU") {return "Файлы";} 
            else if (LANGUAGE == "TR") {return "Dosya";} 
            else {return "Files";}

        case "NO_FILES_FOUND":
            if (LANGUAGE == "RU") {return "Файлов не найдено";}
            else if (LANGUAGE == "TR") {return "Dosya bulunamadı";}  
            else {return "No files found";}
            
        case "FIRMWARE_RELEASE":
            if (LANGUAGE == "RU") {return "Версия ПО";} 
            else if (LANGUAGE == "TR") {return "Yazılım versiyonu";}
            else {return "Firmware release";}

        case "PUMP_PROTOCOLS":
            if (LANGUAGE == "RU") {return "Протоколы ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa protokolleri";} 
            else {return "Pump protocols";}

        case "PROBE_PROTOCOLS":
            if (LANGUAGE == "RU") {return "Протоколы уровнемеров";} 
            else if (LANGUAGE == "TR") {return "Probe protokolleri";} 
            else {return "Probe protocols";}

        case "PRICE_BOARD_PROTOCOLS":
            if (LANGUAGE == "RU") {return "Протоколы ценовых табло";} 
            else if (LANGUAGE == "TR") {return "Fiyat panosu protokolleri";} 
            else {return "Price board protocols";}

        case "READER_PROTOCOLS":
            if (LANGUAGE == "RU") {return "Протоколы считывателей";} 
            else if (LANGUAGE == "TR") {return "Okuyucu protokolleri";} 
            else {return "Reader protocols";}

        case "INDEX":
            if (LANGUAGE == "RU") {return "Индекс";} 
            else if (LANGUAGE == "TR") {return "İndeks";} 
            else {return "Index";}

        case "COMMUNICATION_PROTOCOL":
            if (LANGUAGE == "RU") {return "Протокол обмена";} 
            else if (LANGUAGE == "TR") {return "Haberleşme Protokolü";} 
            else {return "Communication protocol";}

        case "BATTERY_STATUS":
            if (LANGUAGE == "RU") {return "Состояние батареи";} 
            else if (LANGUAGE == "TR") {return "Batarya Durumu";} 
            else {return "Battery status";}

        case "CPU_TEMPERATURE":
            if (LANGUAGE == "RU") {return "Температура ЦПУ";} 
            else if (LANGUAGE == "TR") {return "CPU sıcaklığı";} 
            else {return "CPU temperature";}

        case "DEVICE_IDENTIFIER":
            if (LANGUAGE == "RU") {return "Идентификатор устройства";} 
            else if (LANGUAGE == "TR") {return "Cihaz Kimliği";} 
            else {return "Device identifier";}

        case "DEVICE_ID":
            if (LANGUAGE == "RU") {return "ID устройства";} 
            else if (LANGUAGE == "TR") {return "Cihaz ID";} 
            else {return "Device ID";}

        case "SD_FLASH_DISK":
            if (LANGUAGE == "RU") {return "Карта памяти SD";} 
            else if (LANGUAGE == "TR") {return "SD flash disk";} 
            else {return "SD flash disk";}

        case "SYSTEM_OPERATION":
            if (LANGUAGE == "RU") {return "Работа системы";} 
            else if (LANGUAGE == "TR") {return "Sistem çalışması";} 
            else {return "System operation";}

        case "GPS_RECEIVER_DATA":
            if (LANGUAGE == "RU") {return "Данные GPS приемника";} 
            else if (LANGUAGE == "TR") {return "GPS alıcı verileri";} 
            else {return "GPS receiver data";}

        case "INVALID_DATA":
            if (LANGUAGE == "RU") {return "Недействительные данные";} 
            else if (LANGUAGE == "TR") {return "Geçersiz veri";} 
            else {return "Invalid data";}

        case "VALID_DATA":
            if (LANGUAGE == "RU") {return "Действительные данные";} 
            else if (LANGUAGE == "TR") {return "Geçerli veri";} 
            else {return "Valid data";}

        case "LATITUDE":
            if (LANGUAGE == "RU") {return "Широта";} 
            else if (LANGUAGE == "TR") {return "Enlem";} 
            else {return "Latitude";}

        case "DD_MM_mmmm":
            if (LANGUAGE == "RU") {return "ГГ°ММ.мммм'";} 
            else if (LANGUAGE == "TR") {return "DD°MM.mmmm'";} 
            else {return "DD°MM.mmmm'";}

        case "NORTH_LATITUDE_INDICATOR":
            if (LANGUAGE == "RU") {return "с. ш.";} 
            else if (LANGUAGE == "TR") {return "Kuzey";} 
            else {return "North";}

        case "SOUTH_LATITUDE_INDICATOR":
            if (LANGUAGE == "RU") {return "ю. ш.";} 
            else if (LANGUAGE == "TR") {return "Güney";} 
            else {return "South";}

        case "LONGITUDE":
            if (LANGUAGE == "RU") {return "Долгота";} 
            else if (LANGUAGE == "TR") {return "Boylam";} 
            else {return "Longitude";}

        case "DDD_MM_mmmm":
            if (LANGUAGE == "RU") {return "ГГГ°ММ.мммм'";} 
            else if (LANGUAGE == "TR") {return "DDD°MM.mmmm'";} 
            else {return "DDD°MM.mmmm'";}

        case "EAST_LONGITUDE_INDICATOR":
            if (LANGUAGE == "RU") {return "в. д.";} 
            else if (LANGUAGE == "TR") {return "Doğu";} 
            else {return "East";}

        case "WEST_LONGITUDE_INDICATOR":
            if (LANGUAGE == "RU") {return "з. д.";} 
            else if (LANGUAGE == "TR") {return "Batı";} 
            else {return "West";}

        case "SPEED_OVER_GROUND":
            if (LANGUAGE == "RU") {return "Скорость относительно земли";} 
            else if (LANGUAGE == "TR") {return "Yerde hız";} 
            else {return "Speed over ground";}

        case "KM_PER_HOUR":
            if (LANGUAGE == "RU") {return "км/ч";} 
            else if (LANGUAGE == "TR") {return "km/s";} 
            else {return "km/h";}

        case "COURSE_OVER_GROUND":
            if (LANGUAGE == "RU") {return "Курс по земле";} 
            else if (LANGUAGE == "TR") {return "Zemin üzerinde kurs";} 
            else {return "Course over ground";}

        case "MODE":
            if (LANGUAGE == "RU") {return "Режим";} 
            else if (LANGUAGE == "TR") {return "Mod";} 
            else {return "Mode";}

        case "AUTONOMOUS_MODE":
            if (LANGUAGE == "RU") {return "Автономный";} 
            else if (LANGUAGE == "TR") {return "Özerk";} 
            else {return "Autonomous";}

        case "DGPS":
            if (LANGUAGE == "RU") {return "DGPS";} 
            else if (LANGUAGE == "TR") {return "DGPS";} 
            else {return "DGPS";}

        case "GPS_MODULE_IS_ABSENT":
            if (LANGUAGE == "RU") {return "Отсутствует модуль GPS";} 
            else if (LANGUAGE == "TR") {return "GPS modülü yok";} 
            else {return "GPS module is absent";}
            

        // Configuration page
        case "TAB_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Конфигурация";} 
            else if (LANGUAGE == "TR") {return "Ayarlar";} 
            else {return "Configuration";}

        case "EDIT":
            if (LANGUAGE == "RU") {return "Редакт.";} 
            else if (LANGUAGE == "TR") {return "Düzenle.";} 
            else {return "Edit";}

        case "ID":
            if (LANGUAGE == "RU") {return "№";} 
            else if (LANGUAGE == "TR") {return "No";} 
            else {return "No.";}

        case "PORT":
            if (LANGUAGE == "RU") {return "Порт";} 
            else if (LANGUAGE == "TR") {return "Port";} 
            else {return "Port";}

        case "PROTOCOL":
            if (LANGUAGE == "RU") {return "Протокол";} 
            else if (LANGUAGE == "TR") {return "Protokol";} 
            else {return "Protocol";}

        case "BAUD_RATE":
            if (LANGUAGE == "RU") {return "Скорость";} 
            else if (LANGUAGE == "TR") {return "Baud rate";} 
            else {return "Baud rate";}

        case "PHYSICAL_ADDRESS":
            if (LANGUAGE == "RU") {return "Физический адрес";} 
            else if (LANGUAGE == "TR") {return "Fiziksel Adres";} 
            else {return "Physical address";}

        case "PROTOCOL_IS_NOT_SET":
            if (LANGUAGE == "RU") {return "Протокол не установлен!";} 
            else if (LANGUAGE == "TR") {return "Protokol tanımlanmamış!";} 
            else {return "Protocol is not set!";}

        case "BAUD_RATE_IS_NOT_SET":
            if (LANGUAGE == "RU") {return "Скорость не установлена!";} 
            else if (LANGUAGE == "TR") {return "Baud rate tanımlanmamış!";} 
            else {return "Baud rate is not set!";}

        case "EDIT_RECORD":
            if (LANGUAGE == "RU") {return "Редактирование записи";} 
            else if (LANGUAGE == "TR") {return "Kaydı düzenle";} 
            else {return "Edit record";}

        case "UPDATE":
            if (LANGUAGE == "RU") {return "Обновить";} 
            else if (LANGUAGE == "TR") {return "Güncelle";} 
            else {return "Update";}

        case "ADDRESS":
            if (LANGUAGE == "RU") {return "Адрес";} 
            else if (LANGUAGE == "TR") {return "Adres";} 
            else {return "Address";}

        case "COMMUNICATION_ADDRESS":
            if (LANGUAGE == "RU") {return "Адрес связи";} 
            else if (LANGUAGE == "TR") {return "İletişim adresi";} 
            else {return "Communication address";}

        case "PORT_IS_NOT_SET":
            if (LANGUAGE == "RU") {return "Порт не установлен!";} 
            else if (LANGUAGE == "TR") {return "Port tanımlanmamış!";} 
            else {return "Port is not set!";}

        case "ADDRESS_IS_NOT_SET":
            if (LANGUAGE == "RU") {return "Адрес не установлен!";} 
            else if (LANGUAGE == "TR") {return "Adres tanımlanmamış!";} 
            else {return "Address is not set!";}
            

        // Configuration page System tab
        case "TAB_SETTNGS":
            if (LANGUAGE == "RU") {return "Настройки";} 
            else if (LANGUAGE == "TR") {return "Ayarlar";} 
            else {return "Settings";}
            
        case "DATE_TIME":
            if (LANGUAGE == "RU") {return "Дата/время";} 
            else if (LANGUAGE == "TR") {return "Tarih/Saat";} 
            else {return "Date/time";}

        case "SYSTEM_DATE_TIME":
            if (LANGUAGE == "RU") {return "Системные дата/время";} 
            else if (LANGUAGE == "TR") {return "Sistem tarih/saat";} 
            else {return "System date/time";}

        case "SETS_SYSTEM_DATE_TIME":
            if (LANGUAGE == "RU") {return "Установка системных даты/времени в формате дд.ММ.гг чч:мм:сс";} 
            else if (LANGUAGE == "TR") {return "Sistem tarih/saatini gg.AA.yy ss:dd:ss formatında ayarla";}
            else {return "Sets system date/time in format dd.MM.yy hh:mm:ss";}

        case "AUTO_SYNC":
            if (LANGUAGE == "RU") {return "Автосинхронизация";} 
            else if (LANGUAGE == "TR") {return "Otomatik Eşzamanla";} 
            else {return "Auto sync";}

        case "AUTOMATIC_SYNCHRONIZATION_WITH_TIME_SERVER":
            if (LANGUAGE == "RU") {return "Автоматическая синхронизация с сервером времени";} 
            else if (LANGUAGE == "TR") {return "Zaman sunucu ile otomatik eşzamanlama";} 
            else {return "Automatic synchronization with time server";}

        case "UTC_OFFSET":
            if (LANGUAGE == "RU") {return "Смещение от UTC";} 
            else if (LANGUAGE == "TR") {return "UTC zaman farkı";} 
            else {return "UTC offset";}

        case "NETWORK_SETTINGS":
            if (LANGUAGE == "RU") {return "Сетевые настройки";} 
            else if (LANGUAGE == "TR") {return "Ağ ayarları";} 
            else {return "Network settings";}

        case "IP_ADDRESS":
            if (LANGUAGE == "RU") {return "IP-адрес";} 
            else if (LANGUAGE == "TR") {return "IP-adresi";} 
            else {return "IP-address";}

        case "IN_FORMAT_XXX_XXX_XXX_XXX":
            if (LANGUAGE == "RU") {return "в формате xxx.xxx.xxx.xxx";} 
            else if (LANGUAGE == "TR") {return "xxx.xxx.xxx.xxx formatında";} 
            else {return "in format xxx.xxx.xxx.xxx";}

        case "SETS_IP_ADDRESS":
            if (LANGUAGE == "RU") {return "Устанавливает IP-адрес для IPv4";} 
            else if (LANGUAGE == "TR") {return "IPv4 değerini ayarlar";} 
            else {return "Sets IP-address in IPv4";}

        case "NETWORK_MASK":
            if (LANGUAGE == "RU") {return "Маска сети";} 
            else if (LANGUAGE == "TR") {return "Ağ Maskesi";} 
            else {return "Network mask";}

        case "SETS_NETWORK_MASK":
            if (LANGUAGE == "RU") {return "Устанавливаем маску сети";}
            else if (LANGUAGE == "TR") {return "Ağ maskesini ayarlar";}  
            else {return "Sets network mask";}

        case "GATEWAY":
            if (LANGUAGE == "RU") {return "Шлюз";} 
            else if (LANGUAGE == "TR") {return "Ağ geçidi";} 
            else {return "Gateway";}

        case "SETS_GATEWAY":
            if (LANGUAGE == "RU") {return "Устанавливает шлюз";} 
            else if (LANGUAGE == "TR") {return "Ağ geçidini ayarlar";} 
            else {return "Sets gateway";}

        case "PORT_FOR_HTTP":
            if (LANGUAGE == "RU") {return "Порт для HTTP";} 
            else if (LANGUAGE == "TR") {return "HTTP portu";} 
            else {return "Port for HTTP";}

        case "SETS_PORT_FOR_HTTP_PROTOCOL":
            if (LANGUAGE == "RU") {return "Устанавливает порт для HTTP (диапазон от 1 до 65535)";}
            else if (LANGUAGE == "TR") {return "HTTP protokolü için bağlantı noktasını ayarlar (1-65535 aralığı) ";} 
            else {return "Sets port for HTTP protocol (range from 1 to 65535)";}

        case "PORT_FOR_HTTPS":
            if (LANGUAGE == "RU") {return "Порт для HTTPS";}
            else if (LANGUAGE == "TR") {return "HTTPS Portu";}  
            else {return "Port for HTTPS";}

        case "SETS_PORT_FOR_HTTPS_PROTOCOL":
            if (LANGUAGE == "RU") {return "Устанавливает порт для HTTPS (диапазон от 1 до 65535)";} 
            else if (LANGUAGE == "TR") {return "HTTPS protokolü için bağlantı noktasını ayarlar (1-65535 aralığı)";} 
            else {return "Sets port for HTTPS protocol (range from 1 to 65535)";}

        case "DNS_SERVER":
            if (LANGUAGE == "RU") {return "DNS сервер";} 
            else if (LANGUAGE == "TR") {return "DNS sunucusu";} 
            else {return "DNS server";}

        case "SETS_DNS_DOMAIN_NETWORK_SYSTEM_SERVER":
            if (LANGUAGE == "RU") {return "Устанавливает DNS (domain network system) сервер";} 
            else if (LANGUAGE == "TR") {return "DNS Sunucusunu (domain network system) ayarlar";}
            else {return "Sets DNS (domain network system) server";}

        case "BACKUP_RESTORE_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Сохранение/восстановление конфигурации";} 
            else if (LANGUAGE == "TR") {return "Ayarları yedekle/geri yükle";}
            else {return "Backup/restore configuration";}

        case "SELECT_FILE":
            if (LANGUAGE == "RU") {return "Выберите файл";} 
            else if (LANGUAGE == "TR") {return "Dosya seçiniz";}
            else {return "Select file";}

        case "BACKUP":
            if (LANGUAGE == "RU") {return "Сохранить";} 
            else if (LANGUAGE == "TR") {return "Yedekle";} 
            else {return "Backup";}

        case "RESTORE":
            if (LANGUAGE == "RU") {return "Восстановить";} 
            else if (LANGUAGE == "TR") {return "Geri Yükle";} 
            else {return "Restore";}

        case "DAILY_PROCESSING_TIME":
            if (LANGUAGE == "RU") {return "Ежедневное время обработки файлов";} 
            else if (LANGUAGE == "TR") {return "Günlük dosya işleme süresi";} 
            else {return "Daily files processing time";}

        case "DAILY_PROCESSING_TIME_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Установка времени для обработки файлов, хранящихся на SD-карте контроллера. Файлы обрабатываются один раз в сутки в указанное время, процесс может занять несколько минут.";} 
            else if (LANGUAGE == "TR") {return "Denetleyicinin SD flash diskinde depolanan dosyaların işlenmesi için süreyi ayarlar. Dosyalar belirtilen saatte günde bir kez işlenir, işlem birkaç dakika sürebilir.";} 
            else {return "Sets time for files processing stored on SD flash disk of the controller. Files are processed once a day at the specified time, the process may take several minutes.";}

        case "RESTART":
            if (LANGUAGE == "RU") {return "Перезапуск";} 
            else if (LANGUAGE == "TR") {return "Yeniden Başlat";}
            else {return "Restart";}

        case "RESTART_CONTROLLER":
            if (LANGUAGE == "RU") {return "Перезапустить контроллер";} 
            else if (LANGUAGE == "TR") {return "otomasyon yeniden başlat";} 
            else {return "Restart controller";}

        case "DATE_TIME_SET_INCORRECTLY":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для даты/времени!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz tarih/saat değeri!";} 
            else {return "Date/time set incorrectly!";}

        case "INCORRECT_IP_ADDRESS_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для IP-адреса!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz Ip Adresi değeri!";} 
            else {return "Incorrect IP-address value!";}

        case "INCORRECT_NETWORK_MASK_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для маски сети!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz Ağ Maskesi değeri!";} 
            else {return "Incorrect network mask value!";}

        case "INCORRECT_GATEWAY_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для шлюза!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz Ağ Geçidi değeri!";} 
            else {return "Incorrect gateway value!";}

        case "INCORRECT_HTTP_PORT_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для порта протокола HTTP!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz HTTP Portu!";} 
            else {return "Incorrect HTTP port value!";}

        case "INCORRECT_HTTPS_PORT_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для порта протокола HTTPS!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz HTTPS Portu!";} 
            else {return "Incorrect HTTPS port value!";}

        case "INCORRECT_DNS_SERVER_1_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для DNS-сервера 1!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz 1.DNS Sunucu değeri!";} 
            else {return "Incorrect DNS server 1 value!";}

        case "INCORRECT_DNS_SERVER_2_VALUE":
            if (LANGUAGE == "RU") {return "Указано некорректное значение для DNS-сервера 2!";} 
            else if (LANGUAGE == "TR") {return "Geçersiz 2.DNS Sunucu değeri!";} 
            else {return "Incorrect DNS server 2 value!";}

        case "CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Конфигурация применена!";} 
            else if (LANGUAGE == "TR") {return "Ayarlandı!";}
            else {return "Configuration applied!";}

        case "HOURS_SHORT":
            if (LANGUAGE == "RU") {return "ч";} 
            else if (LANGUAGE == "TR") {return "s";} 
            else {return "h";}

        case "MINUTES_SHORT":
            if (LANGUAGE == "RU") {return "мин";} 
            else if (LANGUAGE == "TR") {return "dk";}
            else {return "min";}

        case "REDIRECTING_TO_DEVICE_INFORMATION_PAGE":
            if (LANGUAGE == "RU") {return "Выполняется переход на страницу инофрмации об устройстве";} 
            else if (LANGUAGE == "TR") {return "Cihaz Bilgi sayfasına yönlendiriliyor";} 
            else {return "Redirecting to Device Information page";}

        case "NO_CONFIGURATION_FILE_FOUND":
            if (LANGUAGE == "RU") {return "Не найден файл конфигурации";} 
            else if (LANGUAGE == "TR") {return "Konfigurasyon dosyası bulunamadı";} 
            else {return "No configuration file found";}

        case "SD_FLASH_DISK_ERROR_PLEASE_RECHECK_SD_FLASH_DISK":
            if (LANGUAGE == "RU") {return "Ошибка карты памяти SD. Пожалуйста, проверьте карту памяти и обновите эту страницу!";} 
            else if (LANGUAGE == "TR") {return "SD Flash Disk hatası.Flash diski kontrol edin ve bu sayfayı yenileyin!";} 
            else {return "SD flash disk error. Please recheck SD flash disk and reload this page!";}

        case "FILE_WITH_SELECTED_EXTENSION_IS_NOT_SUPPORTED_NEED_JS":
            if (LANGUAGE == "RU") {return "Файл с указанным расширением не поддерживается. Пожалуйста, выберите файл с расширением .js!";} 
            else if (LANGUAGE == "TR") {return "Seçtiğinizdosya uzantısı geçerli değil.Lütfen .js uzantılı dosya seçip tekrar deneyiniz!";}
            else {return "File with selected extension is not supported. Please select a file with .js extension!";}

        case "CONFIGURATION_FILE_IS_BEING_UPLOADED":
            if (LANGUAGE == "RU") {return "Файл конфигурации загружается...";} 
            else if (LANGUAGE == "TR") {return "Konfigurasyon dosyası yükleniyor...";} 
            else {return "Configuration file is being uploaded...";}

        case "CONFIGURATION_FILE_UPLOADED_SUCCESSFULLY":
            if (LANGUAGE == "RU") {return "Файл конфигурации успешно загружен!";} 
            else if (LANGUAGE == "TR") {return "Konfigurasyon dosyası başarıyla yüklendi!";}
            else {return "Configuration file uploaded successfully!";}

        case "ERROR_OCCURED_DURING_CONFIGURATION_FILE_UPLOADING":
            if (LANGUAGE == "RU") {return "Во время загрузки файла конфигурации произошла ошибка.";} 
            else if (LANGUAGE == "TR") {return "Konfigurasyon dosyası yüklenirken hata oluştu.";} 
            else {return "Error occured during configuration file uploading.";}

        case "REMOTE_SERVER_SETTINGS":
            if (LANGUAGE == "RU") {return "Настройки удаленного сервера";} 
            else if (LANGUAGE == "TR") {return "Uzak Sunucu ayarları";}
            else {return "Remote server settings";}
        
        case "SERVER_IP_ADDRESS":
            if (LANGUAGE == "RU") {return "IPv4 адрес сервера";} 
            else if (LANGUAGE == "TR") {return "Sunucu IPv4 adresi";} 
            else {return "Server IPv4 address";}

        case "SERVER_DOMAIN_NAME":
            if (LANGUAGE == "RU") {return "Доменное имя";} 
            else if (LANGUAGE == "TR") {return "Alan Adı";} 
            else {return "Domain name";}

        case "SERVER_DOMAIN_NAME_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Доменное имя (если существует)";} 
            else if (LANGUAGE == "TR") {return "Alan Adı (varsa)";} 
            else {return "Domain name (if exists)";}

        case "UPLOAD_DATA":
            if (LANGUAGE == "RU") {return "Выгрузка данных";} 
            else if (LANGUAGE == "TR") {return "Veri yükleme";} 
            else {return "Data upload";}

        case "WEBSOCKETS_COMMUNICATION":
            if (LANGUAGE == "RU") {return "Связь по Websockets";} 
            else if (LANGUAGE == "TR") {return "Web yuvaları iletişimi";} 
            else {return "Websockets communication";}

        case "SERVER_URI":
            if (LANGUAGE == "RU") {return "URI запроса сервера";} 
            else if (LANGUAGE == "TR") {return "Sunucu istek URI";}
            else {return "Server request URI";}

        case "SERVER_URI_DESCRIPTION":
            if (LANGUAGE == "RU") {return "URI запроса сервера без начального слэша";} 
            else if (LANGUAGE == "TR") {return "Sunucu istek URI slash ile başlamadan";} 
            else {return "Server request URI without starting slash";}

        case "SERVER_PORT":
            if (LANGUAGE == "RU") {return "Порт сервера";} 
            else if (LANGUAGE == "TR") {return "Sunucu Erişim Portu";}
            else {return "Server port";}

        case "SERVER_USER":
            if (LANGUAGE == "RU") {return "Пользователь сервера";}
            else if (LANGUAGE == "TR") {return "Sunucu Erişim Kimliği";}  
            else {return "Server user";}

        case "SERVER_USER_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Реквизиты для доступа на удаленный сервер берутся из настроек пользователя";} 
            else if (LANGUAGE == "TR") {return "Uzak sunucu erişimi için kimlik bilgileri, kullanıcı yapılandırmasından alınır";} 
            else {return "Credentials for remote server access are taken from user configuration";}

        case "USE_DEVICE_IDENTIFIER_AS_LOGIN":
            if (LANGUAGE == "RU") {return "Использовать идентификатор устройства в качестве логина";} 
            else if (LANGUAGE == "TR") {return "Giriş olarak cihaz tanımlayıcısını kullan";} 
            else {return "Use device identifier as login";}

        case "PROTOCOL_TYPE":
            if (LANGUAGE == "RU") {return "Тип протокола";}
            else if (LANGUAGE == "TR") {return "Protokol türü";}  
            else {return "Protocol type";}

        case "SERVER_PROTOCOL_TYPE_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Протокол для доступа на удаленный сервер";} 
            else if (LANGUAGE == "TR") {return "Uzak bir sunucuya erişim protokolü";} 
            else {return "Protocol for accessing a remote server";}

        case "SECRET_KEY":
            if (LANGUAGE == "RU") {return "Секретный ключ";} 
            else if (LANGUAGE == "TR") {return "Gizli anahtar";} 
            else {return "Secret key";}

        case "SECRET_KEY_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Секретный ключ, используемый для подписи сообщений. Использование цифровой подписи обеспечивает аутентификацию и целостносость сообщений. Необязательный параметр. Установите флаг при необходимости обновить значение. Если флаг не установлен, то будеn использоваться установленное ранее значение.";} 
            else if (LANGUAGE == "TR") {return "Mesaj imzası için kullanılan gizli anahtar. Dijital imza kullanımı, mesajların kimlik doğrulamasını ve bütünlüğünü sağlar. Parametre isteğe bağlıdır. Değeri güncellemek için gerekirse bayrağı ayarlayın, bayrak ayarlanmamışsa önceden girilmiş bir değer kullanılacaktır.";} 
            else {return "Secret key used for messages signature. Usage of digital signature ensures messages' authentication and integrity. Parameter is optional. Set the flag if necessary to update the value, if the flag is not set - then a previously entered value is to be used.";}

        case "UPDATE_SECRET_KEY":
            if (LANGUAGE == "RU") {return "Обновить ранее введенное значение";} 
            else if (LANGUAGE == "TR") {return "Önceden girilen değeri güncelle";} 
            else {return "Update previously entered value";}

        case "UPLOAD_PUMP_TRANSACTIONS_TO_SERVER":
            if (LANGUAGE == "RU") {return "Отправлять транзакции ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa işlemlerini yükle";}
            else {return "Upload pump transactions";}

        case "UPLOAD_PUMP_TRANSACTIONS_TO_SERVER_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Устанавливает обращения контроллера на удаленный сервер для отправки произведенных транзакции ТРК";} 
            else if (LANGUAGE == "TR") {return "Gerçekleştirilen pompa işlemlerinin otomasyon tarafından uzak sunucuya yüklenmesi için sorgulamayı ayarlar";}
            else {return "Sets polling by the controller to remote server for upload of performed pump transactions";}

        case "UPLOAD_TANK_MEASUREMENTS_TO_SERVER": 
            if (LANGUAGE == "RU") {return "Отправлять измерения в резервуарах";}
            else if (LANGUAGE == "TR") {return "Tank ölçümlerini yükleyin";}
            else {return "Upload tank measurements";}

        case "UPLOAD_TANK_MEASUREMENTS_TO_SERVER_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Устанавливает обращения контроллера на удаленный сервер для отправки зарегистрированных измерений в резервуарах";} 
            else if (LANGUAGE == "TR") {return "Kayıtlı tank ölçümlerinin otomasyon tarafından uzak sunucuya yüklenmesi için sorgulamayı ayarlar";} 
            else {return "Sets polling by the controller to remote server for upload of registered tank measurements";}

        case "UPLOAD_GPS_RECORDS_TO_SERVER": 
            if (LANGUAGE == "RU") {return "Отправлять GPS-координаты";}
            else if (LANGUAGE == "TR") {return "GPS koordinatlarını yükle";} 
            else {return "Upload GPS coordinates";}

        case "UPLOAD_GPS_RECORDS_TO_SERVER_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Устанавливает обращения контроллера на удаленный сервер для отправки GPS-координат";} 
            else if (LANGUAGE == "TR") {return "GPS koordinatlarını göndermek için denetleyici çağrılarını uzak bir sunucuya ayarlar";} 
            else {return "Sets polling by the controller to remote server for upload of GPS coordinates";}

        case "USE_UPLOAD_TEST_REQUESTS": 
            if (LANGUAGE == "RU") {return "Использовать запросы для проверки связи";}
            else if (LANGUAGE == "TR") {return "İletişim kontrolü isteklerini kullanın";} 
            else {return "Use requests for check of communication";}

        case "USE_UPLOAD_TEST_REQUESTS_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Устанавливает периодические обращения контроллера на удаленный сервер для проверки связи";} 
            else if (LANGUAGE == "TR") {return "İletişim kontrolü için kontrolör tarafından uzak sunucuya periyodik yoklama ayarlar";} 
            else {return "Sets periodic polling by the controller to remote server for check of communication";}

        case "UPLOAD_SERVER_COMMUNICATION_STATUS":
            if (LANGUAGE == "RU") {return "Состояние связи с сервером";} 
            else if (LANGUAGE == "TR") {return "Sunucu iletişim durumu";} 
            else {return "Server communication status";}

        case "USE_WEBSOCKETS_COMMUNICATION":
            if (LANGUAGE == "RU") {return "Использовать связь по Websockets";} 
            else if (LANGUAGE == "TR") {return "Websockets iletişimini kullanın";} 
            else {return "Use Websockets communication";}

        case "USE_WEBSOCKETS_COMMUNICATION_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Устанавливает использование связи между контроллером и удаленным сервером по протоколу Websockets";} 
            else if (LANGUAGE == "TR") {return "Yeni yürütme istekleri için otomasyon tarafından uzak sunucuya periyodik sorgulamayı ayarlar";} 
            else {return "Sets to use communication between the controlles and a remote server using Websockets protocol";}

        case "WEBSOCKETS_RECONNECT_PERIOD":
            if (LANGUAGE == "RU") {return "Период переподключения к серверу";} 
            else if (LANGUAGE == "TR") {return "Sunucuya yeniden bağlanma süresi";} 
            else {return "Reconnection period to server";}

        case "WEBSOCKETS_RECONNECT_PERIOD_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Устанавливает период повторного подключения к серверу после завершения соединения в секундах";} 
            else if (LANGUAGE == "TR") {return "Önceki iletişim saniyeler içinde kapatıldıktan sonra sunucuya yeniden bağlantı süresi ayarlar";} 
            else {return "Sets a reconnection period to server after previous communication was closed in seconds";}

        case "SERVER_RESPONSE_TIMEOUT_SECONDS":
            if (LANGUAGE == "RU") {return "Таймаут ожидания ответа от сервера в секундах";} 
            else if (LANGUAGE == "TR") {return "Sunucu yanıtının saniye cinsinden zaman aşımı";} 
            else {return "Timeout of server response in seconds";}

        case "UPLOAD_TEST_REQUESTS_PERIOD_SECONDS":
            if (LANGUAGE == "RU") {return "Период между отправками запросов для проверки связи в секундах";} 
            else if (LANGUAGE == "TR") {return "Saniye cinsinden yükleme testi istekleri gönderme arasındaki süre";} 
            else {return "Period between sending upload test requests in seconds";}
        
            
        // Configuration page Pumps tab
        case "TAB_PUMPS":
            if (LANGUAGE == "RU") {return "ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa";} 
            else {return "Pumps";}
            
        case "PUMP_PORTS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка портов ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa Port Ayarı";} 
            else {return "Pump ports configuration";}

        case "PUMPS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa ayarı";} 
            else {return "Pumps configuration";}

        case "PUMP":
            if (LANGUAGE == "RU") {return "ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa";} 
            else {return "Pump";}

        case "PUMP_PORT":
            if (LANGUAGE == "RU") {return "Порт ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa Portu";} 
            else {return "Pump port";}

        case "PUMPS_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Настройка ТРК применена!";} 
            else if (LANGUAGE == "TR") {return "Pompa ayarları uygulandı!";} 
            else {return "Pumps configuration applied!";}
        

        // Configuration page Probes tab
        case "TAB_PROBES":
            if (LANGUAGE == "RU") {return "Уровнемеры";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu";} 
            else {return "Probes";}
            
        case "PROBE_PORTS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка портов уровнемеров";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu port ayarı";} 
            else {return "Probe ports configuration";}

        case "PROBES_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка уровнемеров";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu ayarı";} 
            else {return "Probes configuration";}

        case "PROBE":
            if (LANGUAGE == "RU") {return "Уровнемер";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu";} 
            else {return "Probe";}

        case "PROBE_PORT":
            if (LANGUAGE == "RU") {return "Порт уровнемеров";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu Portu";} 
            else {return "Probe port";}

        case "PROBES_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Настройка уровнемеров применена!";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu ayarları uygulandı!";} 
            else {return "Probes configuration applied!";}

        case "DISP_PORT_IS_CONFIGURED_WITH_OTHER_DEVICE":
            if (LANGUAGE == "RU") {return "Порт DISP сконфигурирован на работу с другим устройством!";} 
            else if (LANGUAGE == "TR") {return "DISP bağlantı noktası, başka bir aygıtla çalışmak üzere yapılandırılmış!";} 
            else {return "DISP port is configured for operation with another device!";}

        case "LOG_PORT_IS_CONFIGURED_WITH_OTHER_DEVICE":
            if (LANGUAGE == "RU") {return "Порт LOG сконфигурирован на работу с другим устройством!";} 
            else if (LANGUAGE == "TR") {return "LOG bağlantı noktası, başka bir aygıtla çalışmak üzere yapılandırılmış!";} 
            else {return "LOG port is configured for operation with another device!";}

        case "USER_PORT_IS_CONFIGURED_WITH_OTHER_DEVICE":
            if (LANGUAGE == "RU") {return "Порт USER сконфигурирован на работу с другим устройством!";} 
            else if (LANGUAGE == "TR") {return "USER bağlantı noktası, başka bir aygıtla çalışmak üzere yapılandırılmış!";} 
            else {return "USER port is configured for operation with another device!";}
            
    

        // Configuration page Parameters tab
        case "TAB_PARAMETERS":
            if (LANGUAGE == "RU") {return "Параметры";} 
            else if (LANGUAGE == "TR") {return "Parametreler";} 
            else {return "Parameters";}

        case "NOT_SELECTED":
            if (LANGUAGE == "RU") {return "Не выбрано";} 
            else if (LANGUAGE == "TR") {return "Seçilmedi";} 
            else {return "Not selected";}

        case "DEVICE":
            if (LANGUAGE == "RU") {return "Устройство";} 
            else if (LANGUAGE == "TR") {return "Aygıt";} 
            else {return "Device";}

        case "NUMBER":
            if (LANGUAGE == "RU") {return "Номер";} 
            else if (LANGUAGE == "TR") {return "Sıra";} 
            else {return "Number";}

        case "NO_PARAMETERS_TO_DISPLAY":
            if (LANGUAGE == "RU") {return "Нет параметров для отображения!";} 
            else if (LANGUAGE == "TR") {return "Paremetre yok!";}
            else {return "No parameters to display!";}

        case "PUMP_PROTOCOL_SPECIFIC_PARAMETERS":
            if (LANGUAGE == "RU") {return "СПЕЦИАЛЬНЫЕ ПАРАМЕТРЫ ДЛЯ ПРОТОКОЛОВ ТРК";} 
            else if (LANGUAGE == "TR") {return "POMPA PROTOKOLÜ ÖZEL PARAMETRELER";} 
            else {return "PUMP PROTOCOL SPECIFIC PARAMETERS";}

        case "PROBE_PROTOCOL_SPECIFIC_PARAMETERS":
            if (LANGUAGE == "RU") {return "СПЕЦИАЛЬНЫЕ ПАРАМЕТРЫ ДЛЯ ПРОТОКОЛОВ УРОВНЕМЕРОВ";} 
            else if (LANGUAGE == "TR") {return "PROBE PROTOKOLE ÖZEL PARAMETRELER";} 
            else {return "PROBE PROTOCOL SPECIFIC PARAMETERS";}

        case "PARAMETERS_APPLIED":
            if (LANGUAGE == "RU") {return "Параметры применены";} 
            else if (LANGUAGE == "TR") {return "Parametreler uygulandı";} 
            else {return "Parameters applied";}

        case "PARAMETERS_APPLIED_FOR_CONTROLLER":
            if (LANGUAGE == "RU") {return "Параметры применены для контроллера";} 
            else if (LANGUAGE == "TR") {return "Parametreler otomasyon için uygulandı";} 
            else {return "Parameters applied for controller";}

        case "PARAMETERS_APPLIED_FOR_PUMP":
            if (LANGUAGE == "RU") {return "Параметры применены для ТРК";}
            else if (LANGUAGE == "TR") {return "Parametreler pompa için uygulandı";}  
            else {return "Parameters applied for pump";}

        case "PARAMETERS_APPLIED_FOR_PROBE":
            if (LANGUAGE == "RU") {return "Параметры применены для уровнемера";} 
            else if (LANGUAGE == "TR") {return "Parametreler ölçüm çubuğu için uygulandı";} 
            else {return "Parameters applied for probe";}

        case "DEFAULT_VALUE":
            if (LANGUAGE == "RU") {return "Значение по-умолчанию";} 
            else if (LANGUAGE == "TR") {return "Varsayılan değer";} 
            else {return "Default value";}

        case "GET_PARAMETERS_VALUES_AUTOMATICALLY":
            if (LANGUAGE == "RU") {return "Получать значения параметров автоматически";} 
            else if (LANGUAGE == "TR") {return "Parametre değerlerini otomatik olarak alın";} 
            else {return "Get parameters values automatically";}


        // Configuration page Grades tab
        case "TAB_GRADES":
            if (LANGUAGE == "RU") {return "Марки";} 
            else if (LANGUAGE == "TR") {return "Türler";} 
            else {return "Grades";}

        case "GRADE":
            if (LANGUAGE == "RU") {return "Марка";} 
            else if (LANGUAGE == "TR") {return "Tür";} 
            else {return "Grade";}

        case "FUEL_GRADE":
            if (LANGUAGE == "RU") {return "Марка топлива";} 
            else if (LANGUAGE == "TR") {return "Akaryakıt türü";} 
            else {return "Fuel grade";}

        case "PRICE":
            if (LANGUAGE == "RU") {return "Цена";} 
            else if (LANGUAGE == "TR") {return "Fiyat";} 
            else {return "Price";}

        case "TEMPERATURE_EXPANSION_COEFFICIENT":
            if (LANGUAGE == "RU") {return "Коэффициент темп. расширения";} 
            else if (LANGUAGE == "TR") {return "Sıcaklık genleşme katsayısı (kesafet)";} 
            else {return "Temperature expansion coefficient";}

        case "GRADE_NAME":
            if (LANGUAGE == "RU") {return "Марка топлива";} 
            else if (LANGUAGE == "TR") {return "Ürün adı";}
            else {return "Grade name";}

        case "GRADE_PRICE":
            if (LANGUAGE == "RU") {return "Цена топлива";} 
            else if (LANGUAGE == "TR") {return "Ürün fiyatı";} 
            else {return "Grade price";}

        case "GRADE_TEMPERATURE_EXPANSION_COEFFICIENT":
            if (LANGUAGE == "RU") {return "Коэффициент темп. расширения топлива";} 
            else if (LANGUAGE == "TR") {return "Ürün Kesafeti";} 
            else {return "Grade temperature expansion coefficient";}

        case "FUEL_GRADES_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Настройка марок топлива применена!";} 
            else if (LANGUAGE == "TR") {return "Akaryakıt Tür ayarları uygulandı!";} 
            else {return "Fuel grades configuration applied!";}


        // Configuration page Tanks tab
        case "TAB_TANKS":
            if (LANGUAGE == "RU") {return "Резервуары";} 
            else if (LANGUAGE == "TR") {return "Tanklar";} 
            else {return "Tanks";}

        case "TANK":
            if (LANGUAGE == "RU") {return "Резервуар";} 
            else if (LANGUAGE == "TR") {return "Tank";} 
            else {return "Tank";}

        case "HEIGHT":
            if (LANGUAGE == "RU") {return "Высота";} 
            else if (LANGUAGE == "TR") {return "Yükseklik";} 
            else {return "Height";}

        case "HEIGHT_MM":
            if (LANGUAGE == "RU") {return "Высота. мм";} 
            else if (LANGUAGE == "TR") {return "Yükseklik, mm";} 
            else {return "Height, mm";}

        case "TANK_HEIGHT_MM":
            if (LANGUAGE == "RU") {return "Высота. мм";} 
            else if (LANGUAGE == "TR") {return "Tank yüksekliği, mm";} 
            else {return "Tank height, mm";}

        case "HIGH_PRODUCT_ALARM":
            if (LANGUAGE == "RU") {return "Сигнализация о высоком уровне топлива";} 
            else if (LANGUAGE == "TR") {return "Ürün fazla dolum alarmı";} 
            else {return "High product alarm";}

        case "CRITICAL_HIGH_PRODUCT_ALARM":
            if (LANGUAGE == "RU") {return "Сигнализация о критически высоком уровне топлива";} 
            else if (LANGUAGE == "TR") {return "Kritik yüksek ürün alarmı";} 
            else {return "Critical high product alarm";}

        case "HIGH_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о высоком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Ürün fazla dolum alarmı, mm";} 
            else {return "High product alarm, mm";}

        case "CRITICAL_HIGH_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о критически высоком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Kritik yüksek ürün alarmı, mm";} 
            else {return "Critical high product alarm, mm";}

        case "TANK_HIGH_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о высоком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Tank fazla dolum alarmı, mm";} 
            else {return "Tank high product alarm, mm";}

        case "TANK_CRITICAL_HIGH_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о критически высоком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Tank kritik yüksek ürün alarmı, mm";} 
            else {return "Tank critical high product alarm, mm";}

        case "LOW_PRODUCT_ALARM":
            if (LANGUAGE == "RU") {return "Сигнализация о низком уровне топлива";} 
            else if (LANGUAGE == "TR") {return "Düşük seviye ürün alarmı";} 
            else {return "Low product alarm";}

        case "CRITICAL_LOW_PRODUCT_ALARM":
            if (LANGUAGE == "RU") {return "Сигнализация о критически низком уровне топлива";} 
            else if (LANGUAGE == "TR") {return "Kritik düşük ürün alarmı";} 
            else {return "Critical low product alarm";}

        case "LOW_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о низком уровня топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Düşük seviye ürün alarmı, mm";} 
            else {return "Low product alarm, mm";}

        case "CRITICAL_LOW_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о критически низком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Kritik düşük ürün alarmı, mm";} 
            else {return "Critical low product alarm, mm";}

        case "TANK_LOW_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о низком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Tank düşük seviye ürün alarmı, mm";} 
            else {return "Tank low product alarm, mm";}

        case "TANK_CRITICAL_LOW_PRODUCT_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о критически низком уровне топлива, мм";} 
            else if (LANGUAGE == "TR") {return "Tank kritik düşük ürün alarmı, mm";} 
            else {return "Tank critical low product alarm, mm";}

        case "HIGH_WATER_ALARM":
            if (LANGUAGE == "RU") {return "Сигнализация о высоком уровне воды";} 
            else if (LANGUAGE == "TR") {return "Yüksek su alarmı";} 
            else {return "High water alarm";}

        case "HIGH_WATER_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о высоком уровне воды, мм";} 
            else if (LANGUAGE == "TR") {return "Yüksek su alarmı, mm";} 
            else {return "High water alarm, mm";}

        case "TANK_HIGH_WATER_ALARM_MM":
            if (LANGUAGE == "RU") {return "Сигнализация о высоком уровне воды, мм";} 
            else if (LANGUAGE == "TR") {return "Tank yüksek su alarmı, mm";} 
            else {return "Tank high water alarm, mm";}

        case "TANK_CALIBRATION_CHART":
            if (LANGUAGE == "RU") {return "Градуировочная таблица резервуара";} 
            else if (LANGUAGE == "TR") {return "Tank kalibrasyon cetveli";} 
            else {return "Tank calibration chart";}

        case "TANK_NUMBER":
            if (LANGUAGE == "RU") {return "Номер резервуара";} 
            else if (LANGUAGE == "TR") {return "Tank numarası";} 
            else {return "Tank number";}

        case "CALIBRATION_CHART_FILE":
            if (LANGUAGE == "RU") {return "Файл градуировочной таблицы";} 
            else if (LANGUAGE == "TR") {return "Kalibrasyon cetveli dosyası";} 
            else {return "Calibration chart file";}

        case "UPLOAD_NEW_FILE":
            if (LANGUAGE == "RU") {return "Загрузить новый файл";} 
            else if (LANGUAGE == "TR") {return "Yeni dosya yükle";} 
            else {return "Upload new file";}

        case "CHECK_VOLUME":
            if (LANGUAGE == "RU") {return "Проверить объем";} 
            else if (LANGUAGE == "TR") {return "Hacimi kontrol et";} 
            else {return "Check volume";}

        case "INPUT_LEVEL_IN_MM":
            if (LANGUAGE == "RU") {return "Введите уровнень в мм";}
            else if (LANGUAGE == "TR") {return "Seviyeleri mm cinsinden giriniz";}  
            else {return "Input level in millimeters";}

        case "CALCULATED_VOLUME_L_GAL":
            if (LANGUAGE == "RU") {return "Рассчитанный объем (литры, галлоны, др.)";} 
            else if (LANGUAGE == "TR") {return "Hesaplanan Hacim (litre, gallon, diğer)";} 
            else {return "Calculated volume (liters, gallons, other)";}

        case "CALCULATE_VOLUME":
            if (LANGUAGE == "RU") {return "Рассчитать объем";} 
            else if (LANGUAGE == "TR") {return "Hacmi hesapla";} 
            else {return "Calculate volume";}

        case "INVALID_HEIGHT_OF_TANK":
            if (LANGUAGE == "RU") {return "Некорректное значение высоты резервуара";} 
            else if (LANGUAGE == "TR") {return "Geçersiz tank yüksekliği";} 
            else {return "Invalid height of tank";}

        case "INVALID_HEIGHT_VALUE":
            if (LANGUAGE == "RU") {return "Некорректное значение высоты";} 
            else if (LANGUAGE == "TR") {return "Geçersiz yükseklik değeri";} 
            else {return "Invalid height value";}

        case "INVALID_HIGH_PRODUCT_ALARM_HEIGHT_OF_TANK":
            if (LANGUAGE == "RU") {return "Некорректное значение сигнализации высокого уровня топлива";} 
            else if (LANGUAGE == "TR") {return "Geçersiz tank yüksek seviye ürün değeri";}
            else {return "Invalid high product alarm height of tank";}

        case "INVALID_CRITICAL_HIGH_PRODUCT_ALARM_HEIGHT_OF_TANK":
            if (LANGUAGE == "RU") {return "Некорректное значение сигнализации критически высокого уровня топлива";} 
            else if (LANGUAGE == "TR") {return "Geçersiz kritik yüksek ürün alarmı tank yüksekliği";}
            else {return "Invalid critical high product alarm height of tank";}

        case "INVALID_LOW_PRODUCT_ALARM_HEIGHT_OF_TANK":
            if (LANGUAGE == "RU") {return "Некорректное значение сигнализации низкого уровня топлива";} 
            else if (LANGUAGE == "TR") {return "Geçersiz tank düşük seviye ürün değeri";} 
            else {return "Invalid low product alarm height of tank";}

        case "INVALID_CRITICAL_LOW_PRODUCT_ALARM_HEIGHT_OF_TANK":
            if (LANGUAGE == "RU") {return "Некорректное значение сигнализации критически низкого уровня топлива";} 
            else if (LANGUAGE == "TR") {return "Geçersiz kritik düşük ürün alarmı tank yüksekliği";} 
            else {return "Invalid critical low product alarm height of tank";}

        case "INVALID_HIGH_WATER_ALARM_HEIGHT_OF_TANK":
            if (LANGUAGE == "RU") {return "Некорректное значение сигнализации высокого уровня воды";} 
            else if (LANGUAGE == "TR") {return "Geçersiz yüksek su alarmı tank yüksekliği";}
            else {return "Invalid high water alarm height of tank";}

        case "TANKS_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Конфигурация резервуаров применена!";} 
            else if (LANGUAGE == "TR") {return "Tank ayarları uygulandı!";} 
            else {return "Tanks configuration applied!";}

        case "NO_TANK_CALIBRATION_FILE_FOUND":
            if (LANGUAGE == "RU") {return "Не найдено файл градуировочной таблицы резервуара";} 
            else if (LANGUAGE == "TR") {return "Kalibrasyon cetveli dosyası bulunamadı";} 
            else {return "No tank calibration file found";}

        case "TANK_CALIBRATION_FILE_IS_BEING_UPLOADED":
            if (LANGUAGE == "RU") {return "Файл градуировочной таблицы резервуара загружается...";} 
            else if (LANGUAGE == "TR") {return "Tank kalibrasyon dosyası yükleniyor...";} 
            else {return "Tank calibration file is being uploaded...";}

        case "STOP_PUMPS_AT_CRITICAL_LOW_PRODUCT_HEIGHT":
            if (LANGUAGE == "RU") {return "Останавливать ТРК при достижении критически низкого уровня топлива";} 
            else if (LANGUAGE == "TR") {return "Kritik düşük ürün yüksekliğine ulaşıldığında pompaları durdurun";} 
            else {return "Stop pumps at reaching the critical low product height";}


        // Configuration page Nozzles tab
        case "TAB_NOZZLES":
            if (LANGUAGE == "RU") {return "Пистолеты";}
            else if (LANGUAGE == "TR") {return "Tabanca";}
            else {return "Nozzles";}

        case "NO_FUEL_GRADES_CONFIGURED":
            if (LANGUAGE == "RU") {return "Марки топлива не сконфигурированы!";} 
            else if (LANGUAGE == "TR") {return "Tanımlı akaryakıt türü yok!";} 
            else {return "No fuel grades configured!";}

        case "NO_PUMPS_CONFIGURED":
            if (LANGUAGE == "RU") {return "ТРК не сконфигурированы!";} 
            else if (LANGUAGE == "TR") {return "Tanımlı pompa yok!";} 
            else {return "No pumps configured!";}

        case "NO_PUMP_NOZZLES_CONFIGURED":
            if (LANGUAGE == "RU") {return "Привязки пистолетов ТРК к маркам топлива и резервуарам не сконфигурированы!";} 
            else if (LANGUAGE == "TR") {return "Pompa tabancaları ve ilişkilendirildikleri akaryakıt türleri ayarlanmadı!";} 
            else {return "Pump nozzles linkage to fuel grades and tanks not configured!";}

        case "NO_PUMP_NOZZLES_FOR_TANKS_CONFIGURED":
            if (LANGUAGE == "RU") {return "Привязки пистолетов ТРК к резервуарам не сконфигурированы!";} 
            else if (LANGUAGE == "TR") {return "Pompa tabancaları ile hiçbir akaryakıt türü ilişkilendirilmedi!";} 
            else {return "Pump nozzles linkage to tanks not configured!";}

        case "NO_TANKS_CONFIGURED":
            if (LANGUAGE == "RU") {return "Резервуары не сконфигурированы!";} 
            else if (LANGUAGE == "TR") {return "Hiçbir tank ayarlanmadı!";}
            else {return "No tanks configured!";}

        case "GRADE_NOZZLE_1":
            if (LANGUAGE == "RU") {return "Марка пист.\u00A01";} 
            else if (LANGUAGE == "TR") {return "Ürün Tbc.\u00A01";} 
            else {return "Grade noz.\u00A01";}

        case "TANK_NOZZLE_1":
            if (LANGUAGE == "RU") {return "Резервуар пист.\u00A01";} 
            else if (LANGUAGE == "TR") {return "Tank Tbc.\u00A02";} 
            else {return "Tank noz.\u00A01";}

        case "GRADE_NOZZLE_2":
            if (LANGUAGE == "RU") {return "Марка пист.\u00A02";} 
            else if (LANGUAGE == "TR") {return "Ürün Tbc.\u00A02";} 
            else {return "Grade noz.\u00A02";}

        case "TANK_NOZZLE_2":
            if (LANGUAGE == "RU") {return "Резервуар пист.\u00A02";} 
            else if (LANGUAGE == "TR") {return "Tank Tbc.\u00A02";} 
            else {return "Tank noz.\u00A02";}

        case "GRADE_NOZZLE_3":
            if (LANGUAGE == "RU") {return "Марка пист.\u00A03";} 
            else if (LANGUAGE == "TR") {return "Ürün Tbc.\u00A03";} 
            else {return "Grade noz.\u00A03";}

        case "TANK_NOZZLE_3":
            if (LANGUAGE == "RU") {return "Резервуар пист.\u00A03";} 
            else if (LANGUAGE == "TR") {return "Tank Tbc.\u00A03";} 
            else {return "Tank noz.\u00A03";}

        case "GRADE_NOZZLE_4":
            if (LANGUAGE == "RU") {return "Марка пист.\u00A04";} 
            else if (LANGUAGE == "TR") {return "Ürün Tbc.\u00A04";} 
            else {return "Grade noz.\u00A04";}

        case "TANK_NOZZLE_4":
            if (LANGUAGE == "RU") {return "Резервуар пист.\u00A04";} 
            else if (LANGUAGE == "TR") {return "Tank Tbc.\u00A04";} 
            else {return "Tank noz.\u00A04";}

        case "GRADE_NOZZLE_5":
            if (LANGUAGE == "RU") {return "Марка пист.\u00A05";} 
            else if (LANGUAGE == "TR") {return "Ürün Tbc.\u00A05";} 
            else {return "Grade noz.\u00A05";}

        case "TANK_NOZZLE_5":
            if (LANGUAGE == "RU") {return "Резервуар пист.\u00A05";} 
            else if (LANGUAGE == "TR") {return "Tank Tbc.\u00A05";} 
            else {return "Tank noz.\u00A05";}

        case "GRADE_NOZZLE_6":
            if (LANGUAGE == "RU") {return "Марка пист.\u00A06";} 
            else if (LANGUAGE == "TR") {return "Ürün Tbc.\u00A06";} 
            else {return "Grade noz.\u00A06";}

        case "TANK_NOZZLE_6":
            if (LANGUAGE == "RU") {return "Резервуар пист.\u00A06";} 
            else if (LANGUAGE == "TR") {return "Tank Tbc.\u00A06";} 
            else {return "Tank noz.\u00A06";}

        case "PUMP_NOZZLES_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Конфигурация пистолетов применена!";} 
            else if (LANGUAGE == "TR") {return "Pompa tabancaları ayarlandı!";} 
            else {return "Pump nozzles configuration applied!";}

        case "FUEL_GRADE_FOR_NOZZLE":
            if (LANGUAGE == "RU") {return "Марка топлива для пистолета";} 
            else if (LANGUAGE == "TR") {return "Tabancalar için  ürün türleri";} 
            else {return "Fuel grade for nozzle";}

        case "TANK_FOR_NOZZLE":
            if (LANGUAGE == "RU") {return "Резервуар для пистолета";} 
            else if (LANGUAGE == "TR") {return "Tabancalar için tanklar";} 
            else {return "Tank for nozzle";}

        case "OPTIONAL":
            if (LANGUAGE == "RU") {return "Опционально";} 
            else if (LANGUAGE == "TR") {return "opsiyonel";} 
            else {return "Optionally";}


        // Configuration page Price boards tab
        case "TAB_PRICE_BOARDS":
            if (LANGUAGE == "RU") {return "Табло";}
            else if (LANGUAGE == "TR") {return "Panolar";}
            else {return "Boards";}

        case "PRICE_BOARD_PORTS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка портов ценовых табло";} 
            else if (LANGUAGE == "TR") {return "Fiyat panosu bağlantı noktaları yapılandırması";} 
            else {return "Price board ports configuration";}

        case "PRICE_BOARDS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка ценовых табло";} 
            else if (LANGUAGE == "TR") {return "Fiyat panoları yapılandırması";} 
            else {return "Price boards configuration";}

        case "PRICE_BOARD":
            if (LANGUAGE == "RU") {return "Ценовое табло";} 
            else if (LANGUAGE == "TR") {return "Fiyat panosu";} 
            else {return "Price board";}

        case "PRICE_BOARD_PORT":
            if (LANGUAGE == "RU") {return "Порт ценового табло";} 
            else if (LANGUAGE == "TR") {return "Fiyat kurulu bağlantı noktası";} 
            else {return "Price board port";}

        case "PRICE_BOARDS_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Настройка ценовых табло применена!";} 
            else if (LANGUAGE == "TR") {return "Fiyat panoları yapılandırması uygulandı!";} 
            else {return "Price boards configuration applied!";}


        // Configuration page Readers tab
        case "TAB_READERS":
            if (LANGUAGE == "RU") {return "Считыватели";}
            else if (LANGUAGE == "TR") {return "Okuyucular";}
            else {return "Readers";}

        case "READER_PORTS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка портов считывателей";} 
            else if (LANGUAGE == "TR") {return "Okuyucu bağlantı noktaları yapılandırması";} 
            else {return "Reader ports configuration";}

        case "READERS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Настройка считывателей";} 
            else if (LANGUAGE == "TR") {return "Okuyucular yapılandırması";} 
            else {return "Readers configuration";}

        case "READER":
            if (LANGUAGE == "RU") {return "Считыватели";} 
            else if (LANGUAGE == "TR") {return "Okuyucu";} 
            else {return "Reader";}

        case "READER_PORT":
            if (LANGUAGE == "RU") {return "Порт считывателя";} 
            else if (LANGUAGE == "TR") {return "Okuyucu bağlantı noktası";} 
            else {return "Reader port";}

        case "READERS_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Настройка считывателей применена!";} 
            else if (LANGUAGE == "TR") {return "Okuyucu yapılandırması uygulandı!";} 
            else {return "Readers configuration applied!";}

        case "INCORRECT_READERS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Некорректная настройка считывателей";} 
            else if (LANGUAGE == "TR") {return "Yanlış okuyucu yapılandırması";} 
            else {return "Incorrect readers configuration";}

        case "TWO_OR_MORE_READERS_CONFIGURED_TO_SAME_PUMP_NUMBER":
            if (LANGUAGE == "RU") {return "Два или более считывателей сконфигурированы на одинаковый номер ТРК";} 
            else if (LANGUAGE == "TR") {return "Aynı pompa numarasına yapılandırılmış iki veya daha fazla okuyucu";} 
            else {return "Two or more readers are configured to the same pump number";}

        case "TAGS_LIST":
            if (LANGUAGE == "RU") {return "Список меток";} 
            else if (LANGUAGE == "TR") {return "Etiketler listesi";} 
            else {return "Tags list";}

        case "TAGS_LIST_FILE":
            if (LANGUAGE == "RU") {return "Файл со списком меток";} 
            else if (LANGUAGE == "TR") {return "Etiketler listesi dosyası";} 
            else {return "Tags list file";}

        case "NO_TAGS_LIST_FILE_FOUND":
            if (LANGUAGE == "RU") {return "Не найдено файл со списком меток";} 
            else if (LANGUAGE == "TR") {return "Etiket listesi dosyası bulunamadı";} 
            else {return "No tags list file found";}

        case "TAGS_LIST_FILE_IS_BEING_UPLOADED":
            if (LANGUAGE == "RU") {return "Файл со списком меток загружается...";} 
            else if (LANGUAGE == "TR") {return "Etiketler listesi dosyası yükleniyor...";} 
            else {return "Tags list file is being uploaded...";}

        case "TAG":
            if (LANGUAGE == "RU") {return "Метка";} 
            else if (LANGUAGE == "TR") {return "Etiket";} 
            else {return "Tag";}

        case "TAG_ID":
            if (LANGUAGE == "RU") {return "ID";} 
            else if (LANGUAGE == "TR") {return "ID";} 
            else {return "ID";}

        case "TAG_NAME":
            if (LANGUAGE == "RU") {return "Имя";} 
            else if (LANGUAGE == "TR") {return "Adı";} 
            else {return "Name";}

        case "TAG_VALID":
            if (LANGUAGE == "RU") {return "Действует";} 
            else if (LANGUAGE == "TR") {return "Geçerli";} 
            else {return "Valid";}

        case "TAGS_LIST_APPLIED":
            if (LANGUAGE == "RU") {return "Список меток применен!";} 
            else if (LANGUAGE == "TR") {return "Etiketler listesi uygulandı!";} 
            else {return "Tags list applied!";}

        case "AUTOMATICALLY_READ_TAG_BY_READER":
            if (LANGUAGE == "RU") {return "Автоматически считывать метку считывателем";} 
            else if (LANGUAGE == "TR") {return "Okuyucu tarafından bir etiketi otomatik olarak okuyun";} 
            else {return "Automatically read a tag by the reader";}

        case "DUPLICATING_TAGS_IDS":
            if (LANGUAGE == "RU") {return "Две или более меток имеют одинаковый идентификатор";} 
            else if (LANGUAGE == "TR") {return "İki veya daha fazla etiket aynı kimliğe sahip";} 
            else {return "Two or more tags have same ID";}


        // Configuration page Users tab
        case "TAB_USERS":
            if (LANGUAGE == "RU") {return "Пользователи";} 
            else if (LANGUAGE == "TR") {return "Kullanıcılar";} 
            else {return "Users";}

        case "OPTIONAL":
            if (LANGUAGE == "RU") {return "Опционально";} 
            else if (LANGUAGE == "TR") {return "Giriş";} 
            else {return "Login";}

        case "LOGIN":
            if (LANGUAGE == "RU") {return "Логин";} 
            else if (LANGUAGE == "TR") {return "Giriş";} 
            else {return "Login";}

        case "PASSWORD":
            if (LANGUAGE == "RU") {return "Пароль";} 
            else if (LANGUAGE == "TR") {return "Şifre";} 
            else {return "Password";}

        case "PERMISSIONS":
            if (LANGUAGE == "RU") {return "Разрешения";} 
            else if (LANGUAGE == "TR") {return "Yetkiler";} 
            else {return "Permissions";}

        case "CONTROL":
            if (LANGUAGE == "RU") {return "Управление";} 
            else if (LANGUAGE == "TR") {return "Yaz";} 
            else {return "Control";}

        case "MONITORING":
            if (LANGUAGE == "RU") {return "Мониторинг";} 
            else if (LANGUAGE == "TR") {return "Oku";} 
            else {return "Monitoring";}

        case "REPORTS_VIEW":
            if (LANGUAGE == "RU") {return "Просмотр отчетов";} 
            else if (LANGUAGE == "TR") {return "Raporla";} 
            else {return "Reports view";}

        case "USERS_CONFIGURATION_APPLIED":
            if (LANGUAGE == "RU") {return "Конфигурация пользователей применена!";} 
            else if (LANGUAGE == "TR") {return "Kullanıcı ayarları uygulandı!";} 
            else {return "Users configuration applied!";}

        case "CONFIGURATION_PERMISSION":
            if (LANGUAGE == "RU") {return "Разрешение на конфигурирование";} 
            else if (LANGUAGE == "TR") {return "Konfigurasyoon yetkileri";}
            else {return "Configuration permission";}

        case "CONTROL_PERMISSION":
            if (LANGUAGE == "RU") {return "Разрешение на управление";} 
            else if (LANGUAGE == "TR") {return "Yazma yetkisi";} 
            else {return "Control permission";}

        case "MONITORING_PERMISSION":
            if (LANGUAGE == "RU") {return "Разрешение на мониторинг";} 
            else if (LANGUAGE == "TR") {return "Okuma yetkisi";} 
            else {return "Monitoring permission";}

        case "REPORTS_VIEW_PERMISSION":
            if (LANGUAGE == "RU") {return "Разрешение на просмотр отчетов";} 
            else if (LANGUAGE == "TR") {return "Raporlama yetkisi";} 
            else {return "Reports view permission";}

        case "SERVER_ADDRESS_DESCRIPTION":
            if (LANGUAGE == "RU") {return "Адрес сервера (доменное имя или адрес IPv4)";} 
            else if (LANGUAGE == "TR") {return "Sunucu adresi (IPv4 veya alan adı)";} 
            else {return "Server address (domain name or IPv4 address)";}

        case "CONFIGURATION":
            if (LANGUAGE == "RU") {return "Конфигурация";} 
            else if (LANGUAGE == "TR") {return "Ayarlar";} 
            else {return "Configuration";}

            

        // Pumps control page
        case "TAB_PUMPS_CONTROL":
            if (LANGUAGE == "RU") {return "Управление ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa kontrolü";} 
            else {return "Pumps control";}

        case "SELECT_VIEW":
            if (LANGUAGE == "RU") {return "Выберите вид";} 
            else if (LANGUAGE == "TR") {return "Görünüm";}
            else {return "Select view";}

        case "DISPLAY_AS_WIDGETS":
            if (LANGUAGE == "RU") {return "Отобразить как виджеты";}
            else if (LANGUAGE == "TR") {return "Döşeme";}  
            else {return "Display as widgets";}

        case "DISPLAY_AS_TABLE":
            if (LANGUAGE == "RU") {return "Отобразить как таблицу";} 
            else if (LANGUAGE == "TR") {return "Listele";} 
            else {return "Display as table";}

        case "AMOUNT":
            if (LANGUAGE == "RU") {return "Сумма";} 
            else if (LANGUAGE == "TR") {return "Miktar";} 
            else {return "Amount";}

        case "VOLUME":
            if (LANGUAGE == "RU") {return "Объем";} 
            else if (LANGUAGE == "TR") {return "Hacim";} 
            else {return "Volume";}

        case "PRICE":
            if (LANGUAGE == "RU") {return "Цена";} 
            else if (LANGUAGE == "TR") {return "Fiyat";} 
            else {return "Price";}

        case "START":
            if (LANGUAGE == "RU") {return "Пуск";} 
            else if (LANGUAGE == "TR") {return "Başla";} 
            else {return "Start";}

        case "STOP":
            if (LANGUAGE == "RU") {return "Стоп";} 
            else if (LANGUAGE == "TR") {return "Durdur";} 
            else {return "Stop";}

        case "CONFIRM_START":
            if (LANGUAGE == "RU") {return "Подтвердить пуск?";} 
            else if (LANGUAGE == "TR") {return "Başlasın mı?";} 
            else {return "Confirm start?";}

        case "TYPE":
            if (LANGUAGE == "RU") {return "Тип";} 
            else if (LANGUAGE == "TR") {return "Тür";} 
            else {return "Type";}

        case "FULL_TANK":
            if (LANGUAGE == "RU") {return "Полный бак";} 
            else if (LANGUAGE == "TR") {return "Tank Dolu";} 
            else {return "Full tank";}

        case "DOSE":
            if (LANGUAGE == "RU") {return "Доза";} 
            else if (LANGUAGE == "TR") {return "Ön tanımlı Satış Miktarı";} 
            else {return "Dose";}

        case "VALUE":
            if (LANGUAGE == "RU") {return "Значение";} 
            else if (LANGUAGE == "TR") {return "Değer";} 
            else {return "Value";}

        case "NO_PUMP_SELECTED":
            if (LANGUAGE == "RU") {return "Колонка не выбрана";} 
            else if (LANGUAGE == "TR") {return "Pompa seçilmedi";} 
            else {return "No pump selected";}

        case "NO_NOZZLE_SELECTED":
            if (LANGUAGE == "RU") {return "Пистолет не выбрана";} 
            else if (LANGUAGE == "TR") {return "Tabanca seçilmedi";} 
            else {return "No nozzle selected";}

        case "PRICE_IS_NOT_VALID":
            if (LANGUAGE == "RU") {return "Цена неприменима";} 
            else if (LANGUAGE == "TR") {return "Fiyat geçerli değil";} 
            else {return "Price is not valid";}

        case "PRESET_DOSE_IS_NOT_VALID":
            if (LANGUAGE == "RU") {return "Доза преднабора неприменима";} 
            else if (LANGUAGE == "TR") {return "Ön tanımlı Satış Miktarı geçerli değil";} 
            else {return "Preset dose is not valid";}

        case "STATUS":
            if (LANGUAGE == "RU") {return "Состояние";} 
            else if (LANGUAGE == "TR") {return "Durum";} 
            else {return "Status";}

        case "FILLED_VOLUME":
            if (LANGUAGE == "RU") {return "Отпущ. объем";} 
            else if (LANGUAGE == "TR") {return "Dolum Hacmi";} 
            else {return "Filled volume";}

        case "FILLED_AMOUNT":
            if (LANGUAGE == "RU") {return "Отпущ. сумма";} 
            else if (LANGUAGE == "TR") {return "Dolum Miktarı";} 
            else {return "Filled amount";}

        case "TOTAL_VOLUME":
            if (LANGUAGE == "RU") {return "Объем. счетчик";} 
            else if (LANGUAGE == "TR") {return "Toplam Hacim";} 
            else {return "Total volume";}

        case "TOTAL_AMOUNT":
            if (LANGUAGE == "RU") {return "Денеж. счетчик";} 
            else if (LANGUAGE == "TR") {return "Toplam Miktar";} 
            else {return "Total amount";}

        case "USER_SHORT":
            if (LANGUAGE == "RU") {return "Польз.";} 
            else if (LANGUAGE == "TR") {return "Kullanıcı";} 
            else {return "User";}

        case "REQUEST":
            if (LANGUAGE == "RU") {return "Запрос";} 
            else if (LANGUAGE == "TR") {return "Talep";} 
            else {return "Request";}

        case "PRESET_DOSE":
            if (LANGUAGE == "RU") {return "Доза преднабора";} 
            else if (LANGUAGE == "TR") {return "Ön tanımlı satış miktarı";} 
            else {return "Preset dose";}

        case "PRESET_TYPE":
            if (LANGUAGE == "RU") {return "Тип преднабора";} 
            else if (LANGUAGE == "TR") {return "Ön tanım türü";} 
            else {return "Preset type";}

        case "AUTHORIZE":
            if (LANGUAGE == "RU") {return "Авторизовать";} 
            else if (LANGUAGE == "TR") {return "Onayla";} 
            else {return "Authorize";}

        case "STOP":
            if (LANGUAGE == "RU") {return "Стоп";} 
            else if (LANGUAGE == "TR") {return "Durdur";} 
            else {return "Stop";}

        case "RESUME":
            if (LANGUAGE == "RU") {return "Продолжить";} 
            else if (LANGUAGE == "TR") {return "Devam";} 
            else {return "Resume";}

        case "SUSPEND":
            if (LANGUAGE == "RU") {return "Пауза";} 
            else if (LANGUAGE == "TR") {return "Askıya al";} 
            else {return "Suspend";}

        case "EMERGENCY_STOP":
            if (LANGUAGE == "RU") {return "Аварийный стоп";} 
            else if (LANGUAGE == "TR") {return "Acil durdurma";} 
            else {return "Emergency stop";}

        case "GET_PRICES":
            if (LANGUAGE == "RU") {return "Получить цены";} 
            else if (LANGUAGE == "TR") {return "Fiyatları al";} 
            else {return "Get prices";}

        case "SET_PRICES":
            if (LANGUAGE == "RU") {return "Установить цены";} 
            else if (LANGUAGE == "TR") {return "Fiyatları ayarla";} 
            else {return "Set prices";}

        case "GET_TOTALS":
            if (LANGUAGE == "RU") {return "Получить суммарные счетчики";} 
            else if (LANGUAGE == "TR") {return "Toplam sayaçları al";} 
            else {return "Get total counters";}

        case "GET_TAG":
            if (LANGUAGE == "RU") {return "Получить идентификатор";} 
            else if (LANGUAGE == "TR") {return "Etiket Id al";} 
            else {return "Get tag ID";}

        case "SET_LIGHTS_ON":
            if (LANGUAGE == "RU") {return "Включить освещение";} 
            else if (LANGUAGE == "TR") {return "Işıkları aç";} 
            else {return "Turn lights on";}

        case "SET_LIGHTS_OFF":
            if (LANGUAGE == "RU") {return "Выключить освещение";} 
            else if (LANGUAGE == "TR") {return "Işıkları kapat";} 
            else {return "Turn lights off";}

        case "CONFIRM_AUTHORIZATION":
            if (LANGUAGE == "RU") {return "Подтвердите авторизацию";} 
            else if (LANGUAGE == "TR") {return "Yetkilendirmeyi onayla";} 
            else {return "Confirm authorization";}

        case "NO_PUMPS":
            if (LANGUAGE == "RU") {return "Нет ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa yok";} 
            else {return "No pumps";}

        case "PUMP_IS_BUSY":
            if (LANGUAGE == "RU") {return "ТРК занята";} 
            else if (LANGUAGE == "TR") {return "Pompa meşgul";} 
            else {return "Pump is busy";}

        case "PUMP_IS_NOT_IN_FILLING_STATE":
            if (LANGUAGE == "RU") {return "ТРК не в состоянии налива";} 
            else if (LANGUAGE == "TR") {return "Pompa dolum durumunda değil";} 
            else {return "Pump is not in filling state";}

        case "PRICE_OF_NOZZLE":
            if (LANGUAGE == "RU") {return "Цена пистолета";} 
            else if (LANGUAGE == "TR") {return "Tabanca fiyatı";} 
            else {return "Price of nozzle";}

        case "TAG":
            if (LANGUAGE == "RU") {return "Идентификатор";} 
            else if (LANGUAGE == "TR") {return "Etiket";} 
            else {return "Tag";}           
            

        // Tanks monitoring page
        case "TAB_TANKS_MONITORING":
            if (LANGUAGE == "RU") {return "Мониторинг резервуаров";} 
            else if (LANGUAGE == "TR") {return "Tank Ekranı";} 
            else {return "Tanks monitoring";}

        case "PRODUCT_HEIGHT":
            if (LANGUAGE == "RU") {return "Высота продукта";} 
            else if (LANGUAGE == "TR") {return "Ürün yüksekliği";} 
            else {return "Product height";}

        case "PRODUCT_HEIGHT_MM":
            if (LANGUAGE == "RU") {return "Высота продукта, мм";} 
            else if (LANGUAGE == "TR") {return "Ürün yüksekliği, mm";} 
            else {return "Product height, mm";}
        
        case "PRODUCT_VOLUME":
            if (LANGUAGE == "RU") {return "Объем продукта";} 
            else if (LANGUAGE == "TR") {return "Ürün Hacmi";} 
            else {return "Product volume";}
        
        case "PRODUCT_VOLUME_L":
            if (LANGUAGE == "RU") {return "Объем продукта, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Ürün hacmi, " + getVolumeUnit();} 
            else {return "Product volume, " + getVolumeUnit();}
        
        case "PRODUCT_TC_VOLUME":
            if (LANGUAGE == "RU") {return "Темп.-комп. объем продукта";} 
            else if (LANGUAGE == "TR") {return "Toplam Tank Hacmi";} 
            else {return "Product TC volume";}
        
        case "PRODUCT_TC_VOLUME_L":
            if (LANGUAGE == "RU") {return "Темп.-комп. объем продукта, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Toplam Tank Hacmi, " + getVolumeUnit();} 
            else {return "Product TC volume, " + getVolumeUnit();}
        
        case "PRODUCT_ULLAGE":
            if (LANGUAGE == "RU") {return "Незаполненый объем продукта";} 
            else if (LANGUAGE == "TR") {return "Tanktan azalan";}
            else {return "Product ullage";}
        
        case "PRODUCT_ULLAGE_L":
            if (LANGUAGE == "RU") {return "Незаполненый объем продукта, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Tanktan Azalan Ürün, " + getVolumeUnit();} 
            else {return "Product ullage, " + getVolumeUnit();}
        
        case "TEMPERATURE":
            if (LANGUAGE == "RU") {return "Температура";} 
            else if (LANGUAGE == "TR") {return "Sıcaklık";} 
            else {return "Temperature";}
        
        case "TEMPERATURE_DEGREES_CELCIUS":
            if (LANGUAGE == "RU") {return "Температура, " + getTemperatureUnit();} 
            else if (LANGUAGE == "TR") {return "Sıcaklık, " + getTemperatureUnit();} 
            else {return "Temperature, " + getTemperatureUnit();}
        
        case "WATER_HEIGHT_MM":
            if (LANGUAGE == "RU") {return "Высота воды, мм";} 
            else if (LANGUAGE == "TR") {return "Su Seviyesi, mm";} 
            else {return "Water height, mm";}
        
        case "WATER_HEIGHT":
            if (LANGUAGE == "RU") {return "Высота воды";} 
            else if (LANGUAGE == "TR") {return "Su Seviyesi";} 
            else {return "Water height";}
        
        case "WATER_VOLUME":
            if (LANGUAGE == "RU") {return "Объем воды";} 
            else if (LANGUAGE == "TR") {return "Su Hacmi";} 
            else {return "Water volume";}
        
        case "WATER_VOLUME_L":
            if (LANGUAGE == "RU") {return "Объем воды, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Su Hacmi, " + getVolumeUnit();} 
            else {return "Water volume, " + getVolumeUnit();}
        
        case "PRODUCT_DENSITY":
            if (LANGUAGE == "RU") {return "Плотность продукта";} 
            else if (LANGUAGE == "TR") {return "Ürün yoğunluğu";} 
            else {return "Product density";}
        
        case "PRODUCT_DENSITY_KG_M3":
            if (LANGUAGE == "RU") {return "Плотность продукта, кг/м\u00B3";} 
            else if (LANGUAGE == "TR") {return "Ürün Yoğunluğu, kg/m\u00B3";} 
            else {return "Product density, kg/m\u00B3";}
        
        case "PRODUCT_MASS":
            if (LANGUAGE == "RU") {return "Масса продукта";} 
            else if (LANGUAGE == "TR") {return "Ürün kütlesi";} 
            else {return "Product mass";}
        
        case "PRODUCT_MASS_KG":
            if (LANGUAGE == "RU") {return "Масса продукта, кг";} 
            else if (LANGUAGE == "TR") {return "Ürün kütlesi, кг";} 
            else {return "Product mass, kg";}
        
        case "PUMPS_DISPENSED_VOLUME":
            if (LANGUAGE == "RU") {return "Объем, отпущенный через ТРК";} 
            else if (LANGUAGE == "TR") {return "Dağıtılan hacmi pompalar";} 
            else {return "Pumps dispensed volume";}
        
        case "MM":
            if (LANGUAGE == "RU") {return "мм";} 
            else if (LANGUAGE == "TR") {return "mm";} 
            else {return "mm";}
        
        case "L":
            if (LANGUAGE == "RU") {return "л";} 
            else if (LANGUAGE == "TR") {return "L";} 
            else {return "L";}
        
        case "DEGREES_CELCIUS":
            if (LANGUAGE == "RU") {return "&deg;C";} 
            else if (LANGUAGE == "TR") {return "&deg;C";} 
            else {return "&deg;C";}
        
        case "KG/M3":
            if (LANGUAGE == "RU") {return "кг/м\u00B3";} 
            else if (LANGUAGE == "TR") {return "kg/m\u00B3";} 
            else {return "kg/m\u00B3";}
        
        case "KG":
            if (LANGUAGE == "RU") {return "кг";} 
            else if (LANGUAGE == "TR") {return "kg";} 
            else {return "kg";}
        
        case "TANK_ALARM_REGISTERED":
            if (LANGUAGE == "RU") {return "Сигнализирование от резервуара!";} 
            else if (LANGUAGE == "TR") {return "Tank alarmı kaydedildi!";} 
            else {return "Tank alarm registered!";}

        case "HIGH_PRODUCT_ALARM_REGISTERED":
            if (LANGUAGE == "RU") {return "Сигнализирование о высоком уровне топлива!";} 
            else if (LANGUAGE == "TR") {return "Fazla dolum kaydedildi!";} 
            else {return "High product alarm registered!";}

        case "LOW_PRODUCT_ALARM_REGISTERED":
            if (LANGUAGE == "RU") {return "Сигнализирование о низком уровне топлива!";} 
            else if (LANGUAGE == "TR") {return "Düşük seviye ürün kaydedildi!";} 
            else {return "Low product alarm registered!";}

        case "CRITICAL_HIGH_PRODUCT_ALARM_REGISTERED":
            if (LANGUAGE == "RU") {return "Сигнализирование о критически высоком уровне топлива!";} 
            else if (LANGUAGE == "TR") {return "Kritik yüksek ürün alarmı kaydedildi!";} 
            else {return "Critical high product alarm registered!";}

        case "CRITICAL_LOW_PRODUCT_ALARM_REGISTERED":
            if (LANGUAGE == "RU") {return "Сигнализирование о критически низком уровне топлива!";} 
            else if (LANGUAGE == "TR") {return "Kritik düşük ürün alarmı kaydedildi!";} 
            else {return "Critical low product alarm registered!";}

        case "HIGH_WATER_ALARM_REGISTERED":
            if (LANGUAGE == "RU") {return "Сигнализирование о высоком уровне воды!";} 
            else if (LANGUAGE == "TR") {return "Yüksek su alarmı kaydedildi!";} 
            else {return "High water alarm registered!";}

        case "MEASUREMENTS_ON_START":
            if (LANGUAGE == "RU") {return "Значения измерений в начале прихода";} 
            else if (LANGUAGE == "TR") {return "Açılışta ölçüm";} 
            else {return "Measurements on start";}

        case "MEASUREMENTS_ON_END":
            if (LANGUAGE == "RU") {return "Значения измерений в конце прихода";} 
            else if (LANGUAGE == "TR") {return "Kapanışta ölçüm";} 
            else {return "Measurements on end";}

        case "LAST_IN_TANK_DELIVERY":
            if (LANGUAGE == "RU") {return "Последний приход";} 
            else if (LANGUAGE == "TR") {return "Последний приход";} 
            else {return "Last in-tank delivery";}

        case "DELIVERY_ABSOLUTE_VALUES":
            if (LANGUAGE == "RU") {return "Абсолютные значения прихода";} 
            else if (LANGUAGE == "TR") {return "Mutlak teslimat değeri";} 
            else {return "Delivery absolute values";}

        case "ALARM":
            if (LANGUAGE == "RU") {return "Тревога";} 
            else if (LANGUAGE == "TR") {return "Alarm";} 
            else {return "Alarm";}
            

        // Reporting page    
        case "TAB_REPORTING":
            if (LANGUAGE == "RU") {return "Отчетность";} 
            else if (LANGUAGE == "TR") {return "Raporlama";} 
            else {return "Reporting";}

        case "DEVICE_NUMBER":
            if (LANGUAGE == "RU") {return "Номер устройства";} 
            else if (LANGUAGE == "TR") {return "Aygıt kimliği";} 
            else {return "Device number";}

        case "DATE_TIME_START":
            if (LANGUAGE == "RU") {return "Дата/время начала";} 
            else if (LANGUAGE == "TR") {return "Tarih/Saat Başlat";} 
            else {return "Date/time start";}

        case "DATE_TIME_END":
            if (LANGUAGE == "RU") {return "Дата/время окончания";} 
            else if (LANGUAGE == "TR") {return "Tarih/Saat Bitir";} 
            else {return "Date/time end";}

        case "DIRECTION":
            if (LANGUAGE == "RU") {return "Направление";} 
            else if (LANGUAGE == "TR") {return "Yön";} 
            else {return "Direction";}

        case "ALL":
            if (LANGUAGE == "RU") {return "Все";} 
            else if (LANGUAGE == "TR") {return "Hepsi";} 
            else {return "All";}

        case "SYSTEM_USER":
            if (LANGUAGE == "RU") {return "Системный пользователь";} 
            else if (LANGUAGE == "TR") {return "Sistem kullanıcısı";} 
            else {return "System user";}

        case "INCREASE":
            if (LANGUAGE == "RU") {return "Возрастание";} 
            else if (LANGUAGE == "TR") {return "Yükselt";} 
            else {return "Increase";}

        case "DECREASE":
            if (LANGUAGE == "RU") {return "Убывание";} 
            else if (LANGUAGE == "TR") {return "Alçalt";} 
            else {return "Decrease";}

        case "PUMP_NOZZLES_SUMMARY_REPORT_WITHOUT_TOTALS":
            if (LANGUAGE == "RU") {return "Построить отчет по пистолетам ТРК без суммарных счетчиков";} 
            else if (LANGUAGE == "TR") {return "Pompa tabanca özeti";} 
            else {return "Pump nozzles summary report without totals";}

        case "PUMP_NOZZLES_SUMMARY_REPORT_WITH_TOTALS":
            if (LANGUAGE == "RU") {return "Построить отчет по пистолетам ТРК с суммарными счетчиками";} 
            else if (LANGUAGE == "TR") {return "Toplam Pompa tabanca özeti";} 
            else {return "Pump nozzles summary report with totals";}

        case "PUMPS_AND_TANKS_RECONCILIATION":
            if (LANGUAGE == "RU") {return "Сверка по ТРК и резервуарам";} 
            else if (LANGUAGE == "TR") {return "Tank ve Pompa Mutabakatı";} 
            else {return "Pumps and tanks reconciliation";}

        case "GENERATE_TANK_RECONCILIATION_REPORT":
            if (LANGUAGE == "RU") {return "Построить отчет по сверке";} 
            else if (LANGUAGE == "TR") {return "Tank Mutabakatı oluştur";}
            else {return "Generate tank reconciliation report";}

        case "GENERATE_TANK_LEVEL_CHANGE_CHART":
            if (LANGUAGE == "RU") {return "Построить график изменений уровня в резервуаре";} 
            else if (LANGUAGE == "TR") {return "Tank seviye değişim raporu oluştur";} 
            else {return "Generate tank level change chart";}

        case "GENERATE_REPORT":
            if (LANGUAGE == "RU") {return "Построить отчет";} 
            else if (LANGUAGE == "TR") {return "Rapor oluştur";} 
            else {return "Generate report";}

        case "TRANSACTION":
            if (LANGUAGE == "RU") {return "Транзакция";} 
            else if (LANGUAGE == "TR") {return "İşlemler";} 
            else {return "Transaction";}

        case "FILLED_VOLUME_L":
            if (LANGUAGE == "RU") {return "Отпущенный объем, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Dolum hacmi, " + getVolumeUnit();} 
            else {return "Filled volume, " + getVolumeUnit();}

        case "VOLUME_TOTALS_L":
            if (LANGUAGE == "RU") {return "Объемный счетчик, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Hacim toplamları, " + getVolumeUnit();} 
            else {return "Volume totals, " + getVolumeUnit();}

        case "AMOUNT_TOTALS":
            if (LANGUAGE == "RU") {return "Денежный счетчик";} 
            else if (LANGUAGE == "TR") {return "Miktar toplamları";} 
            else {return "Amount totals";}

        case "TOTAL":
            if (LANGUAGE == "RU") {return "Всего";} 
            else if (LANGUAGE == "TR") {return "Toplam";} 
            else {return "Total";}

        case "SUMMARY_FILLED_VOLUME_L":
            if (LANGUAGE == "RU") {return "Общий отпущенный объем, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Dolum hacimleri özeti, " + getVolumeUnit();} 
            else {return "Summary filled volume, " + getVolumeUnit();}

        case "SUMMARY_FILLED_AMOUNT":
            if (LANGUAGE == "RU") {return "Общая отпущенная сумма";} 
            else if (LANGUAGE == "TR") {return "Dolum miktarları özeti";} 
            else {return "Summary filled amount";}

        case "VOLUME_TOTALS_ON_START_L":
            if (LANGUAGE == "RU") {return "Объемный счетчик на начало, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Başlangıçtaki hacim toplamları, " + getVolumeUnit();} 
            else {return "Volume totals on start, " + getVolumeUnit();}

        case "VOLUME_TOTALS_ON_END_L":
            if (LANGUAGE == "RU") {return "Объемный счетчик на конец, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Bitişteki hacim toplamları, " + getVolumeUnit();} 
            else {return "Volume totals on end, " + getVolumeUnit();}

        case "VOLUME_TOTALS_DIFFERENCE_L":
            if (LANGUAGE == "RU") {return "Разница объемных счетчиков, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Toplam hacim farkları, " + getVolumeUnit();} 
            else {return "Volume totals difference, " + getVolumeUnit();}

        case "AMOUNT_TOTALS_ON_START":
            if (LANGUAGE == "RU") {return "Денежный счетчик на начало";} 
            else if (LANGUAGE == "TR") {return "Başlangıçtaki miktar toplamları";} 
            else {return "Amount totals on start";}

        case "AMOUNT_TOTALS_ON_END":
            if (LANGUAGE == "RU") {return "Денежный счетчик на конец";} 
            else if (LANGUAGE == "TR") {return "Bitişteki miktar toplamları";} 
            else {return "Amount totals on end";}

        case "AMOUNT_TOTALS_DIFFERENCE":
            if (LANGUAGE == "RU") {return "Разница денежных счетчиков";} 
            else if (LANGUAGE == "TR") {return "Toplam miktar farkları";} 
            else {return "Amount totals difference";}

        case "AVERAGE_FILLING_SPEED":
            if (LANGUAGE == "RU") {return "Средняя скорость налива, " + getVolumeUnit() + "/мин";} 
            else if (LANGUAGE == "TR") {return "Toplam miktar farkları, " + getVolumeUnit() + "/dk";} 
            else {return "Average filling speed, " + getVolumeUnit() + "/min";}

        case "START_DATE_TIME_SET_INCORRECTLY":
            if (LANGUAGE == "RU") {return "Дата/время начала указано некорректно!";} 
            else if (LANGUAGE == "TR") {return "Başlangıç tarih/saat 'i geçersiz!";} 
            else {return "Start date/time set incorrectly!";}

        case "END_DATE_TIME_SET_INCORRECTLY":
            if (LANGUAGE == "RU") {return "Дата/время окончания указано некорректно!";} 
            else if (LANGUAGE == "TR") {return "Bitiş tarih/saat 'i geçersiz!";} 
            else {return "End date/time set incorrectly!";}

        case "START_DATE_TIME_IS_LATER_THAN_END_DATE_TIME":
            if (LANGUAGE == "RU") {return "Указанная дата/время начала позже чем дата/время окончания!";} 
            else if (LANGUAGE == "TR") {return "Başlangıç zamanı bitiş zamanından sonra!";}
            else {return "Start date.time is later than end date/time!";}

        case "FOR":
            if (LANGUAGE == "RU") {return "Для";} 
            else if (LANGUAGE == "TR") {return "için";} 
            else {return "For";}

        case "ALL_PUMPS":
            if (LANGUAGE == "RU") {return "всех ТРК";} 
            else if (LANGUAGE == "TR") {return "tüm Pompalar";} 
            else {return "all pumps";}

        case "FROM":
            if (LANGUAGE == "RU") {return "от";} 
            else if (LANGUAGE == "TR") {return "'den";} 
            else {return "from";}

        case "TILL":
            if (LANGUAGE == "RU") {return "до";} 
            else if (LANGUAGE == "TR") {return "'e kadar";} 
            else {return "till";}

        case "PUMPS_TRANSACTIONS_REPORT":
            if (LANGUAGE == "RU") {return "Отчет по транзакциям ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa işlem raporu";} 
            else {return "Pumps transactions report";}

        case "PUMPS_NOZZLES_SUMMARY_REPORT":
            if (LANGUAGE == "RU") {return "Суммарный отчет по пистолетам ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa tabanca özet raporu";} 
            else {return "Pumps nozzles summary report";}

        case "PRODUCT_VOLUME_ON_START_L":
            if (LANGUAGE == "RU") {return "Объем топлива на начало, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Dönem Başı Ürün Stoğu, " + getVolumeUnit();} 
            else {return "Product volume on start, " + getVolumeUnit();}

        case "SUMMARY_INCREASED_VOLUME_L":
            if (LANGUAGE == "RU") {return "Суммарный прирост объема, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Tanka Dolum, " + getVolumeUnit();} 
            else {return "Summary increased volume, " + getVolumeUnit();}

        case "SUMMARY_DECREASED_VOLUME_L":
            if (LANGUAGE == "RU") {return "Суммарное уменьшение объема, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Tanktaki Azalış, " + getVolumeUnit();} 
            else {return "Summary decreased volume, " + getVolumeUnit();}

        case "FILLED_BY_PUMPS_L":
            if (LANGUAGE == "RU") {return "Объем отпусков через ТРК, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Pompa satışları, " + getVolumeUnit();} 
            else {return "Volume filled by pumps, " + getVolumeUnit();}

        case "CALCULATED_PRODUCT_VOLUME_ON_END_L":
            if (LANGUAGE == "RU") {return "Расчетный остаток, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Olması Gereken DönemSonu Ürün Stoğu, " + getVolumeUnit();} 
            else {return "Calculated product volume on end, " + getVolumeUnit();}

        case "ACTUAL_PRODUCT_VOLUME_ON_END_L":
            if (LANGUAGE == "RU") {return "Действительный остаток, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Fiili DönemSonu Ürün Stoğu , " + getVolumeUnit();} 
            else {return "Actual product volume on end, " + getVolumeUnit();}

        case "DIFFERENCE_BETWEEN_ACTUAL_AND_CALCULATED_VOLUMES_L":
            if (LANGUAGE == "RU") {return "Разница между действительным и расчетным остатками, " + getVolumeUnit();} 
            else if (LANGUAGE == "TR") {return "Fiili ve Olması Gereken Ürün Stoğu Farkı, " + getVolumeUnit();}
            else {return "Difference between actual and calculated volumes, " + getVolumeUnit();}

        case "ALL_TANKS":
            if (LANGUAGE == "RU") {return "всем резервуарам";} 
            else if (LANGUAGE == "TR") {return "Tüm Tanklar";} 
            else {return "all tanks";}

        case "FOR_TANK":
            if (LANGUAGE == "RU") {return "по резервуару";} 
            else if (LANGUAGE == "TR") {return "Tank için";} 
            else {return "for tank";}

        case "FOR_ALL_TANKS":
            if (LANGUAGE == "RU") {return "по всем резервуарам";} 
            else if (LANGUAGE == "TR") {return "tüm tanklar için";} 
            else {return "for all tanks";}

        case "TANK_LEVEL_CHANGES_REPORT":
            if (LANGUAGE == "RU") {return "Отчет по изменениям уровней в резервуарах";} 
            else if (LANGUAGE == "TR") {return "Tank seviye değişimi raporu";} 
            else {return "Tank level changes report";}

        case "TANK_LEVEL_CHANGES_CHART":
            if (LANGUAGE == "RU") {return "График по изменениям уровней в резервуаре";} 
            else if (LANGUAGE == "TR") {return "Tank seviye değişimi grafiği";}
            else {return "Tank level changes chart";}

        case "TANK_LEVEL_CHANGES_CHART":
            if (LANGUAGE == "RU") {return "График по изменениям уровней в резервуаре";} 
            else if (LANGUAGE == "TR") {return "Tank seviye değişimi grafiği";} 
            else {return "Tank level changes chart";}

        case "TANK_RECONCILIATION_REPORT":
            if (LANGUAGE == "RU") {return "Отчет по сверке";} 
            else if (LANGUAGE == "TR") {return "Tank mutabakat raporu";} 
            else {return 'Tank reconciliation report';}

        case "TAB_PUMPS_AND_TANKS":
            if (LANGUAGE == "RU") {return "ТРК и резервуары";} 
            else if (LANGUAGE == "TR") {return "Pompa ve Tanklar";} 
            else {return 'Pumps and tanks';}

        case "REPORT_FILES":
            if (LANGUAGE == "RU") {return "Файлы отчетов";} 
            else if (LANGUAGE == "TR") {return "Rapor dosyaları";} 
            else {return 'Report files';}

        case "REPORT_FILE_IS_NOT_SUPPORTED_SELECT_FILE":
            if (LANGUAGE == "RU") {return "Файл отчета не поддерживается. Пожалуйста, выберите файл";} 
            else if (LANGUAGE == "TR") {return "Rapor dosyası desteklenmiyor.Lütfen dosya seçiniz";} 
            else {return "Report file is not supported. Please select file";}

        case "REPORT_FILE_IS_BEING_UPLOADED":
            if (LANGUAGE == "RU") {return "Файл отчета загружается...";} 
            else if (LANGUAGE == "TR") {return "Rapor dosyası yükleniyor...";} 
            else {return "Report file is being uploaded...";}

        case "REPORT_FILE_UPLOADED_SUCCESSFULLY":
            if (LANGUAGE == "RU") {return "Файл отчета успешно загружен!";} 
            else if (LANGUAGE == "TR") {return "Rapor dosyası başarıyla yüklendi!";} 
            else {return "Report file uploaded successfully!";}

        case "ERROR_OCCURED_DURING_REPORT_FILE_UPLOADING":
            if (LANGUAGE == "RU") {return "Во время загрузки файла отчета произошла ошибка.";} 
            else if (LANGUAGE == "TR") {return "Rapor dosyası yüklemesi sırasında hata oluştu.";} 
            else {return "Error occured during report file uploading.";}

        case "UPLOAD_NEW_REPORT_FILE":
            if (LANGUAGE == "RU") {return "Загрузка нового файла отчета";} 
            else if (LANGUAGE == "TR") {return "Yeni rapor dosyası yükle";} 
            else {return "Upload new report file";}

        case "NO_REPORT_FILES_FOUND":
            if (LANGUAGE == "RU") {return "Файлов отчетов не найдено";} 
            else if (LANGUAGE == "TR") {return "Rapor dosyası bulunamadı";}
            else {return "No report files found";}

        case "LATITUDE":
            if (LANGUAGE == "RU") {return "Широта";} 
            else if (LANGUAGE == "TR") {return "Enlem";}
            else {return "Latitude";}

        case "NORTH_SOUTH_INDICATOR":
            if (LANGUAGE == "RU") {return "Север/юг";} 
            else if (LANGUAGE == "TR") {return "Kuzey/Güney";}
            else {return "North/South";}

        case "LONGITUDE":
            if (LANGUAGE == "RU") {return "Долгота";} 
            else if (LANGUAGE == "TR") {return "Boylam";}
            else {return "Longitude";}

        case "EAST_WEST_INDICATOR":
            if (LANGUAGE == "RU") {return "Восток/запад";} 
            else if (LANGUAGE == "TR") {return "Doğu/Batı";}
            else {return "East/West";}

        case "SPEED_OVER_GROUND":
            if (LANGUAGE == "RU") {return "Скорость, км/ч";} 
            else if (LANGUAGE == "TR") {return "Hız, km/s";}
            else {return "Speed, km/h";}

        case "COURSE_OVER_GROUND":
            if (LANGUAGE == "RU") {return "Курс, град.";} 
            else if (LANGUAGE == "TR") {return "Kurs, derece";}
            else {return "Course, degrees";}
            
        case "MODE":
            if (LANGUAGE == "RU") {return "Режим";} 
            else if (LANGUAGE == "TR") {return "Mod";}
            else {return "Mode";}

        case "GPS_COORDINATES_REPORT":
            if (LANGUAGE == "RU") {return "Отчет по GPS координатам";} 
            else if (LANGUAGE == "TR") {return "GPS koordinatları raporu";}
            else {return "GPS coordinates report";}

        case "GPS":
            if (LANGUAGE == "RU") {return "GPS";} 
            else if (LANGUAGE == "TR") {return "GPS";}
            else {return "GPS";}
            

        // Logging page
        case "TAB_LOGGING":
            if (LANGUAGE == "RU") {return "Логгирование";} 
            else if (LANGUAGE == "TR") {return "Loglanıyor";}
            else {return "Logging";}

        case "CURRENT_DATE_TIME":
            if (LANGUAGE == "RU") {return "Текущие дата/время";} 
            else if (LANGUAGE == "TR") {return "Güncel Tarih/Saat";} 
            else {return "Current date/time";}

        case "DATE_TIME_TO_STOP":
            if (LANGUAGE == "RU") {return "Дата/время останова";} 
            else if (LANGUAGE == "TR") {return "Durdurulacak Tarih/Saat";} 
            else {return "Date/time to stop";}

        case "DATE_TIME_SET_INCORRECTLY":
            if (LANGUAGE == "RU") {return "Дата/время установлены некорректно!";} 
            else if (LANGUAGE == "TR") {return "Tarih/Saat geçersiz!";} 
            else {return "Date/time set incorrectly!";}

        case "TIME_SET_INCORRECTLY":
            if (LANGUAGE == "RU") {return "Время установлено некорректно!";} 
            else if (LANGUAGE == "TR") {return "Zaman yanlış ayarlanmış!";} 
            else {return "Time set incorrectly!";}

        case "NO_LOGGING_FILE_FOUND":
            if (LANGUAGE == "RU") {return "Файл лога не найден";} 
            else if (LANGUAGE == "TR") {return "Loglama dosyası bulunamadı";} 
            else {return "No logging file found";}

        case "LOGGING_PROCESS_IS_RUNNING":
            if (LANGUAGE == "RU") {return "Идет процесс записи лога...";} 
            else if (LANGUAGE == "TR") {return "Günlüğe kaydetme işlemi çalışıyor...";} 
            else {return "Logging process is running...";}

        case "LOG_PROCESS_IS_STOPPED":
            if (LANGUAGE == "RU") {return "Запись лога остановлена.";} 
            else if (LANGUAGE == "TR") {return "Loglama işlemi durdurulur.";} 
            else {return "Logging process is stopped.";}

        case "PORT_TO_LOG_IS_NOT_SPECIFIED":
            if (LANGUAGE == "RU") {return "Порт логгирования не указан.";} 
            else if (LANGUAGE == "TR") {return "Günlüğe kaydedilecek bağlantı noktası belirtilmedi.";} 
            else {return "Port to log is not specified.";}

        case "VALUE_OF_DATE_TIME_TO_STOP_SHOULD_BE_SET_LATER_THAN_CURRENT_DATE_TIME":
            if (LANGUAGE == "RU") {return "Время остановки лога должно быть установлено более поздним по сравнению с текущим временем.";} 
            else if (LANGUAGE == "TR") {return "Günlüğün durdurulacağı tarih/saat değeri, geçerli tarih/saatten sonra ayarlanmalıdır.";} 
            else {return "Value of date/time to stop log should be set later than the current date/time.";}
            

        // Self-diagnostics page
        case "TAB_SELF_DIAGNOSTICS":
            if (LANGUAGE == "RU") {return "Самодиагностика";} 
            else if (LANGUAGE == "TR") {return "Otomatik Sınama";} 
            else {return "Self diagnostics";}

        case "RS485_PORTS":
            if (LANGUAGE == "RU") {return "Порты RS-485";} 
            else if (LANGUAGE == "TR") {return "RS-485 Portları";} 
            else {return "RS-485 ports";}

        case "DIAGNOSTICS_RS485_PORTS_DESC":
            if (LANGUAGE == "RU") {return "Для диагностики портов с интерфейсом RS-485 выполните";} 
            else if (LANGUAGE == "TR") {return "RS-485 Port Sınamaları";} 
            else {return "For diagnostics of RS-485 ports";}

        case "DIAGNOSTICS_RS485_PORTS_A":
            if (LANGUAGE == "RU") {return "соедините между собой линии А каждого из портов с интерфейсом RS-485";} 
            else if (LANGUAGE == "TR") {return "Herbir RS-485 A hattını birbirleriyle kısa devre yapınız ";} 
            else {return "short close lines A of each RS-485 ports with each other";}

        case "DIAGNOSTICS_RS485_PORTS_B":
            if (LANGUAGE == "RU") {return "соедините между собой линии B каждого из портов с интерфейсом RS-485";} 
            else if (LANGUAGE == "TR") {return "Herbir RS-485 B hattını birbirleriyle kısa devre yapınız";} 
            else {return "short close lines B of each RS-485 ports with each other";}

        case "TRANSMITTING_PORTS":
            if (LANGUAGE == "RU") {return "Передающие порты";} 
            else if (LANGUAGE == "TR") {return "Yayın yapan portlar";} 
            else {return "Transmitting ports";}

        case "RECEIVING_PORTS":
            if (LANGUAGE == "RU") {return "Принимающие порты";} 
            else if (LANGUAGE == "TR") {return "Dinleyen portlar";} 
            else {return "Receiving ports";}

        case "RS232_PORTS":
            if (LANGUAGE == "RU") {return "Порты RS-232";} 
            else if (LANGUAGE == "TR") {return "RS-232 portları";} 
            else {return "RS-232 ports";}

        case "DIAGNOSTICS_RS232_PORTS_DESC":
            if (LANGUAGE == "RU") {return "Для диагностики портов с интерфейсомRS-232 закоротите линии Rx и Tx на каждом из портов с интерфейсом RS-232";} 
            else if (LANGUAGE == "TR") {return "RS-232 port sınaması için herbir RS-232portunda  Tx ve Rx hattını kısa devre yapınız";} 
            else {return "For diagnostics of RS-232 ports short close lines Tx and Rx in each RS-232 port";}

        case "PORTS":
            if (LANGUAGE == "RU") {return "Порты";} 
            else if (LANGUAGE == "TR") {return "Portlar";} 
            else {return "Ports";}
            
        case "STATES":
            if (LANGUAGE == "RU") {return "Состояния";} 
            else if (LANGUAGE == "TR") {return "Durum";} 
            else {return "States";}
            
        case "STATE":
            if (LANGUAGE == "RU") {return "Состояние";} 
            else if (LANGUAGE == "TR") {return "Durum";} 
            else {return "State";}
            
        case "PC_PORT":
            if (LANGUAGE == "RU") {return "Порт PC";} 
            else if (LANGUAGE == "TR") {return "PC Portu";} 
            else {return "PC port";}
            
        case "DISP_PORT":
            if (LANGUAGE == "RU") {return "Порт DISP";} 
            else if (LANGUAGE == "TR") {return "DISP Portu";} 
            else {return "DISP port";}
        
        case "USER_PORT":
            if (LANGUAGE == "RU") {return "Порт USER";} 
            else if (LANGUAGE == "TR") {return "USER Portu";} 
            else {return "USER port";}
    
        case "LOG_PORT":
            if (LANGUAGE == "RU") {return "Порт LOG";} 
            else if (LANGUAGE == "TR") {return "LOG Portu";} 
            else {return "LOG port";}
    
        case "DIP_SWITCHES":
            if (LANGUAGE == "RU") {return "DIP-переключатели";} 
            else if (LANGUAGE == "TR") {return "DIP-switches";} 
            else {return "DIP-switches";}

        case "SD_FLASH_DISK":
            if (LANGUAGE == "RU") {return "Карта памяти SD";} 
            else if (LANGUAGE == "TR") {return "SD flash disk";} 
            else {return "SD flash disk";}

        case "ON":
            if (LANGUAGE == "RU") {return "Вкл.";} 
            else if (LANGUAGE == "TR") {return "Açık.";} 
            else {return "On";}

        case "OFF":
            if (LANGUAGE == "RU") {return "Выкл.";} 
            else if (LANGUAGE == "TR") {return "Kapalı.";} 
            else {return "Off";}
            

        // Firmware update page
        case "TAB_FIRMWARE_UPDATE":
            if (LANGUAGE == "RU") {return "Обновление ПО";} 
            else if (LANGUAGE == "TR") {return "Yazılım güncelleme";} 
            else {return "Firmware update";}

        case "PATH_TO_FIRMWARE_FILE":
            if (LANGUAGE == "RU") {return "Путь к файлу прошивки 'c_pts2.bin'";} 
            else if (LANGUAGE == "TR") {return "Güncelleme dosyası yolu 'c_pts2.bin'";} 
            else {return "Path to firmware file 'c_pts2.bin'";}

        case "FILE_WITH_SELECTED_EXTENSION_IS_NOT_SUPPORTED_NEED_BIN":
            if (LANGUAGE == "RU") {return "Файл с указанным расширением не поддерживается. Пожалуйста, выберите файл с расширением .bin!";} 
            else if (LANGUAGE == "TR") {return "Seçtiğiniz dosyanın uzantısı uyumsuz.Lütfen .bin uzantılı dosya seçiniz!";} 
            else {return "File with selected extension is not supported. Please select a file with .bin extension!";}

        case "FIRMWARE_FILE_IS_BEING_UPLOADED":
            if (LANGUAGE == "RU") {return "Файл прошивки загружается...";} 
            else if (LANGUAGE == "TR") {return "Güncelleme dosyası yükleniyor...";} 
            else {return "Firmware file is being uploaded...";}

        case "FIRMWARE_FILE_UPLOADED_RESTARTING_AND_UPDATING":
            if (LANGUAGE == "RU") {return "Файл прошивки загружен. Выполняется перезагрузка. Не отключайте контроллер от питания!";} 
            else if (LANGUAGE == "TR") {return "Güncelleme dosyası başarı ile yüklendi.Yeniden başlatılıyor ve güncelleniyor.Lütfen cihazı kapatmayınız!";} 
            else {return "Firmware file upload completed. Restarting and updating. Do not power off the controller!";}

        case "ERROR_OCCURED_DURING_FIRMWARE_FILE_UPLOADING":
            if (LANGUAGE == "RU") {return "Во время загрузки файла прошивки произошла проблема.";} 
            else if (LANGUAGE == "TR") {return "Güncelleme dosyası yüklenirken hata oluştu.";} 
            else {return "Error occured during firmware file uploading.";}

        case "FIRMWARE_FILE_UPLOADED_SUCCESSFULLY":
            if (LANGUAGE == "RU") {return "Файл прошивки успешно загружен!";} 
            else if (LANGUAGE == "TR") {return "Güncelleme dosyası başarıyla yüklendi!";} 
            else {return "Firmware file uploaded successfully!";}

        case "SELECT_FIRMWARE_FILE":
            if (LANGUAGE == "RU") {return "Выберите файл прошивки";} 
            else if (LANGUAGE == "TR") {return "Güncelleme dosyası seçiniz";} 
            else {return "Select firmware file";}


        // PTS-2 controller error codes
        case "NO_DATA":
            if (LANGUAGE == "RU") {return "Нет данных";} 
            else if (LANGUAGE == "TR") {return "Veri yok";} 
            else {return "No data";}
            
        case "INVALID_JSON_REQUEST":
            if (LANGUAGE == "RU") {return "Недействительный JSON запрос";} 
            else if (LANGUAGE == "TR") {return "Geçersiz JSON isteği";} 
            else {return "Invalid JSON request";}
            
        case "NO_DATA_FOR_RESPONSE":
            if (LANGUAGE == "RU") {return "Нет данных для ответа";} 
            else if (LANGUAGE == "TR") {return "Yanıt için veri yok";} 
            else {return "No data for response";}
            
        case "JSON_REQUEST_IS_TOO_LONG":
            if (LANGUAGE == "RU") {return "Слишком длинный JSON запрос";} 
            else if (LANGUAGE == "TR") {return "JSON isteği çok uzun";} 
            else {return "JSON request is too long";}

        case "JSONPTS_ERROR_NOT_FOUND":
            if (LANGUAGE == "RU") {return "Не найдено";} 
            else if (LANGUAGE == "TR") {return "Bulunamadı";} 
            else {return "Not found";}

        case "JSONPTS_ERROR_NO_PERMISSIONS":
            if (LANGUAGE == "RU") {return "Доступ запрещен";} 
            else if (LANGUAGE == "TR") {return "Erişim engellendi";} 
            else {return "Access forbidden";}

        case "JSONPTS_ERROR_NO_SD_FOUND":
            if (LANGUAGE == "RU") {return "Карта памяти SD не найдена";} 
            else if (LANGUAGE == "TR") {return "SD flash disk bulunamadı";} 
            else {return "No SD flash disk found";}

        case "JSONPTS_ERROR_POWER_DOWN_DETECTED":
            if (LANGUAGE == "RU") {return "Обнаружено пропадание питания";} 
            else if (LANGUAGE == "TR") {return "Elektrik kesintisi tespit edildi";} 
            else {return "Power down detected";}

        case "JSONPTS_ERROR_SD_NOT_MOUNTED":
            if (LANGUAGE == "RU") {return "Карта памяти SD не смонтирована";} 
            else if (LANGUAGE == "TR") {return "SD flash disk biçimlendirilmemiş";} 
            else {return "SD flash disk is not mounted";}

        case "JSONPTS_ERROR_FILE_UPLOAD_PROCESS_RUNNING":
            if (LANGUAGE == "RU") {return "Идет процесс загрузки файла";} 
            else if (LANGUAGE == "TR") {return "Dosya yükleme işlemi devam ediyor";} 
            else {return "File upload process running";}

        case "JSONPTS_ERROR_SD_ERROR":
            if (LANGUAGE == "RU") {return "Ошибка карты мамяти SD";} 
            else if (LANGUAGE == "TR") {return "SD flash disk hatası";} 
            else {return "SD flash disk error";}

        case "JSONPTS_ERROR_NO_CALIBRATION_CHART_FOUND_ERROR":
            if (LANGUAGE == "RU") {return "Градуировочная таблица не найдена";} 
            else if (LANGUAGE == "TR") {return "Kalibrasyon cetveli bulunamadı";} 
            else {return "No calibration chart found";}

        case "JSONPTS_ERROR_COULD_NOT_CHECK_FILE":
            if (LANGUAGE == "RU") {return "Не удалось проверить файл";} 
            else if (LANGUAGE == "TR") {return "Dosya teyit edilemiyor";} 
            else {return "Could not check file";}

        case "JSONPTS_ERROR_COULD_NOT_DELETE_FILE":
            if (LANGUAGE == "RU") {return "Не удалось удалить файл";} 
            else if (LANGUAGE == "TR") {return "Dosya silinemiyor";} 
            else {return "Could not delete file";}

        case "JSONPTS_ERROR_INCORRECT_PUMPS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Некорректная конфигурация ТРК";} 
            else if (LANGUAGE == "TR") {return "Geçersiz Pompa ayarı";} 
            else {return "Incorrect pumps configuration";}

        case "JSONPTS_ERROR_INCORRECT_PROBES_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Некорректная конфигурация уровнемеров";} 
            else if (LANGUAGE == "TR") {return "Geçersiz ölçüm çubuğu ayarı";} 
            else {return "Incorrect probes configuration";}

        case "JSONPTS_ERROR_COULD_NOT_GET_DATETIME":
            if (LANGUAGE == "RU") {return "Не удалось получить дату и время";} 
            else if (LANGUAGE == "TR") {return "Tarih/Saat bilgisi alınamıyor";} 
            else {return "Could not get datetime";}

        case "JSONPTS_ERROR_COULD_NOT_GET_PUMP_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер ТРК";} 
            else if (LANGUAGE == "TR") {return "Pompa numarası alınamıyor";} 
            else {return "Could not get pump number";}

        case "JSONPTS_ERROR_COULD_NOT_GET_PUMP_TRANSACTION_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер транзакции";} 
            else if (LANGUAGE == "TR") {return "Pompa işlem numarası alınamıyor";} 
            else {return "Could not get pump transaction number";}

        case "JSONPTS_ERROR_PUMP_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера ТРК выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Pompa numarası aralık dışında";} 
            else {return "Pump number is out of range";}

        case "JSONPTS_ERROR_PUMP_TRANSACTION_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера транзакции выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Pompa işlem numarası aralık dışında";} 
            else {return "Pump transaction number is out of range";}

        case "JSONPTS_ERROR_PUMP_TRANSACTION_NOT_FOUND":
            if (LANGUAGE == "RU") {return "Транзакцию не найдено";} 
            else if (LANGUAGE == "TR") {return "Pompa işlemi bulunamadı";} 
            else {return "Pump transaction not found";}

        case "JSONPTS_ERROR_TANK_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера резервуара выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Tank numarası aralık dışında";} 
            else {return "Tank number is out of range";}

        case "JSONPTS_ERROR_COULD_NOT_GET_TANK_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер резервуара";} 
            else if (LANGUAGE == "TR") {return "Tank numarası alınamıyor";} 
            else {return "Could not get tank number";}

        case "JSONPTS_ERROR_COULD_NOT_GET_TRANSACTION_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер транзакции";} 
            else if (LANGUAGE == "TR") {return "İşlem numarası alınamıyor";} 
            else {return "Could not get transaction number";}

        case "JSONPTS_ERROR_TRANSACTION_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера транзакции выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "İşlem numarası aralık dışında";} 
            else {return "Transaction number is out of range";}

        case "JSONPTS_ERROR_TRANSACTION_NUMBER_NOT_MATCH":
            if (LANGUAGE == "RU") {return "Номер транзакции не совпадает";} 
            else if (LANGUAGE == "TR") {return "İşlem numarası uyumsuz";} 
            else {return "Transaction number does not match";}

        case "JSONPTS_ERROR_TRANSACTION_NUMBER_ALREADY_EXIST":
            if (LANGUAGE == "RU") {return "Номер транзакции уже существует";} 
            else if (LANGUAGE == "TR") {return "İşlem numarası zaten let";} 
            else {return "Transaction number already exist";}

        case "JSONPTS_ERROR_COULD_NOT_GET_NOZZLE_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер пистолета";} 
            else if (LANGUAGE == "TR") {return "Tabanca numarası alınamadı";} 
            else {return "Could not get nozzle number";}

        case "JSONPTS_ERROR_COULD_NOT_GET_FUEL_GRADE_ID":
            if (LANGUAGE == "RU") {return "Не удалось получить Id марки топлива";} 
            else if (LANGUAGE == "TR") {return "Ürün kimliği alınamadı";} 
            else {return "Could not get fuel grade Id";}

        case "JSONPTS_ERROR_COULD_NOT_GET_NOZZLE_NUMBER_FUEL_GRADE_ID":
            if (LANGUAGE == "RU") {return "Не удалось получить номер пистолета и Id марки топлива";} 
            else if (LANGUAGE == "TR") {return "Tabanca ve ürün kimliği alınamadı";} 
            else {return "Could not get nozzle number and fuel grade Id";}

        case "JSONPTS_ERROR_COULD_NOT_GET_NOZZLE_NUMBER_FROM_GRADE_ID":
            if (LANGUAGE == "RU") {return "Не удалось получить номер пистолета из Id марки топлива";} 
            else if (LANGUAGE == "TR") {return "Ürün kimliğinden tabanca numarası alınamadı";} 
            else {return "Could not get nozzle number from fuel grade Id";}

        case "JSONPTS_ERROR_NOZZLE_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера пистолета выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Tabanca numarası aralık dışında";} 
            else {return "Nozzle number is out of range";}

        case "JSONPTS_ERROR_COULD_NOT_GET_TYPE":
            if (LANGUAGE == "RU") {return "Не удалось получить значение типа";} 
            else if (LANGUAGE == "TR") {return "Tür alınamadı";} 
            else {return "Could not get type";}

        case "JSONPTS_ERROR_COULD_NOT_GET_NAME":
            if (LANGUAGE == "RU") {return "Не удалось получить имя";} 
            else if (LANGUAGE == "TR") {return "Tanım alınamadı";} 
            else {return "Could not get name";}

        case "JSONPTS_ERROR_TYPE_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение типа выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Tanım aralık dışında";} 
            else {return "Type is out of range";}

        case "JSONPTS_ERROR_COULD_NOT_GET_DOSE_VALUE":
            if (LANGUAGE == "RU") {return "Не удалось получить значение дозы";} 
            else if (LANGUAGE == "TR") {return "Ön tanımlı Satış Miktarı alınamadı";} 
            else {return "Could not get dose value";}

        case "JSONPTS_ERROR_COULD_NOT_GET_PRICE_VALUE":
            if (LANGUAGE == "RU") {return "Не удалось получить значение цены";} 
            else if (LANGUAGE == "TR") {return "Fiyat alınamadı";} 
            else {return "Could not get price value";}
            
        case "JSONPTS_ERROR_DUPLICATED_AUTHORIZATION_COMMAND":
            if (LANGUAGE == "RU") {return "Продублированная команда авторизации";} 
            else if (LANGUAGE == "TR") {return "Tekrarlanan yetkilendirme emri";} 
            else {return "Duplicated authorization command";}
            
        case "JSONPTS_ERROR_PUMP_BUSY_OTHER_USER":
            if (LANGUAGE == "RU") {return "ТРК занята другим пользователем";} 
            else if (LANGUAGE == "TR") {return "Pompa başka bir kullanıcı tarafından meşgul";} 
            else {return "Pump is busy by other user";}
            
        case "JSONPTS_ERROR_PUMP_BUSY_OTHER_COMMAND_EXECUTED":
            if (LANGUAGE == "RU") {return "ТРК занята обработкой другой команды";} 
            else if (LANGUAGE == "TR") {return "Pomppa başka bir işlemi gerçekleştiriyor";} 
            else {return "Pump is busy with other command being executed";}
            
        case "JSONPTS_ERROR_PUMP_BUSY_FILLING":
            if (LANGUAGE == "RU") {return "ТРК находится в состоянии налива";} 
            else if (LANGUAGE == "TR") {return "Pompa satış yapıyor";} 
            else {return "Pump is busy with filling";}
            
        case "JSONPTS_ERROR_PUMP_FUEL_GRADE_NOT_CORRESPOND_TANK":
            if (LANGUAGE == "RU") {return "Марка топлива для пистолета ТРК не соответствует марке топлива резервуара";} 
            else if (LANGUAGE == "TR") {return "Pompa memesi yakıt sınıfı, tank yakıt sınıfına uymuyor";} 
            else {return "Pump nozzle fuel grade does not correspond to tank fuel grade";}
            
        case "JSONPTS_ERROR_PUMP_NOT_IN_FILLING_PROCESS":
            if (LANGUAGE == "RU") {return "ТРК не находится в состоянии налива";} 
            else if (LANGUAGE == "TR") {return "Pompa şu an satış durumunda değil";} 
            else {return "Pump is not in filling process";}
            
        case "JSONPTS_ERROR_COULD_NOT_GET_STATE_VALUE":
            if (LANGUAGE == "RU") {return "Не удалось получить значение состояния";} 
            else if (LANGUAGE == "TR") {return "Durum bilgisi alınamıyor";} 
            else {return "Could not get state value";}
            
        case "JSONPTS_ERROR_STATE_VALUE_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение состояния выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Durum tanımlı aralık dışında";} 
            else {return "State value is out of range";}
            
        case "JSONPTS_ERROR_USER_NOT_MATCH":
            if (LANGUAGE == "RU") {return "Пользователь не совпадает";} 
            else if (LANGUAGE == "TR") {return "Kullanıcı eşleşmedi";} 
            else {return "User does not match";}
            
        case "JSONPTS_ERROR_DATE_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение даты выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Tarih geçerli aralık dışında";} 
            else {return "Date is out of range";}
            
        case "JSONPTS_ERROR_TIME_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение времени выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Saat geçerli aralık dışında";} 
            else {return "Time is out of range";}
            
        case "JSONPTS_ERROR_COULD_NOT_GET_HEIGHT":
            if (LANGUAGE == "RU") {return "Не удалось получить значение высоты";} 
            else if (LANGUAGE == "TR") {return "Yükseklik bilgisi alınamıyor";} 
            else {return "Could not get height value";}
            
        case "JSONPTS_ERROR_COULD_NOT_GET_PROBE_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер уровнемера";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu numarası alınamıyor";} 
            else {return "Could not get probe number";}
            
        case "JSONPTS_ERROR_PROBE_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера уровнемера выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Ölçüm Çubuğu numarası aralık dışında";} 
            else {return "Probe number is out of range";}
            
        case "JSONPTS_ERROR_PUMP_IS_NOT_CONFIGURED":
            if (LANGUAGE == "RU") {return "ТРК не сконфигурирована";} 
            else if (LANGUAGE == "TR") {return "Pompa ayarlanmamış";} 
            else {return "Pump is not configured";}
            
        case "JSONPTS_ERROR_RESTORE_CONFIGURATION_FAILED":
            if (LANGUAGE == "RU") {return "Восстановление конфигурации не удалось";} 
            else if (LANGUAGE == "TR") {return "Geri yükleme başarısız";} 
            else {return "Restore of configuration failed";}
            
        case "JSONPTS_ERROR_CONFIGURATION_FILE_NOT_FOUND":
            if (LANGUAGE == "RU") {return "Файл конфигурации не найден";} 
            else if (LANGUAGE == "TR") {return "Konfigurasyon dosyası bulunamadı";} 
            else {return "Configuration file not found";}
            
        case "JSONPTS_ERROR_CALIBRATION_CHART_NOT_CONFIGURED":
            if (LANGUAGE == "RU") {return "Для резервуара не настроена градуировочная таблица";} 
            else if (LANGUAGE == "TR") {return "Tank kalibrasyon cetveli girilmemiş";} 
            else {return "Calibration chart for tank is not configured";}
            
        case "JSONPTS_ERROR_TANK_NOT_CONFIGURED":
            if (LANGUAGE == "RU") {return "Резервуар не сконфигурирован";} 
            else if (LANGUAGE == "TR") {return "Tank ayarlanmamış";} 
            else {return "Tank is not configured";}
            
        case "JSONPTS_ERROR_INCORRECT_TANKS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Некорректная конфигурация резервуаров";} 
            else if (LANGUAGE == "TR") {return "Yanlış tank konfigürasyonu";} 
            else {return "Incorrect tanks configuration";}

        case "JSONPTS_ERROR_INCORRECT_PRICE_BOARDS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Некорректная конфигурация ценовых табло";} 
            else if (LANGUAGE == "TR") {return "Yanlış fiyat panoları yapılandırması";} 
            else {return "Incorrect price boards configuration";}

        case "JSONPTS_ERROR_INCORRECT_READERS_CONFIGURATION":
            if (LANGUAGE == "RU") {return "Некорректная конфигурация считывателей";} 
            else if (LANGUAGE == "TR") {return "Yanlış okuyucu yapılandırması";} 
            else {return "Incorrect readers configuration";}

        case "JSONPTS_ERROR_COULD_NOT_GET_TAG":
            if (LANGUAGE == "RU") {return "Не удалось получить метку";} 
            else if (LANGUAGE == "TR") {return "Etiket alınamadı";} 
            else {return "Could not get tag";}

        case "JSONPTS_ERROR_COULD_NOT_GET_READER_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер считывателя";} 
            else if (LANGUAGE == "TR") {return "Okuyucu numarası alınamadı";} 
            else {return "Could not get reader number";}

        case "JSONPTS_ERROR_READER_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера считывателя выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Okuyucu numarası aralık dışında";} 
            else {return "Reader number is out of range";}

        case "JSONPTS_ERROR_READER_NOT_CONFIGURED":
            if (LANGUAGE == "RU") {return "Считыватель не сконфигурирован";} 
            else if (LANGUAGE == "TR") {return "Okuyucu yapılandırılmamış";} 
            else {return "Reader is not configured";}

        case "JSONPTS_ERROR_TANK_PRODUCT_HEIGHT_IS_CRITICAL_LOW":
            if (LANGUAGE == "RU") {return "В резервуаре топливо на критически низком уовне";} 
            else if (LANGUAGE == "TR") {return "Tanktaki ürün yüksekliği kritik derecede düşük";} 
            else {return "Product height in tank is critically low";}

        case "JSONPTS_ERROR_COULD_NOT_GET_PRICE_BOARD_NUMBER":
            if (LANGUAGE == "RU") {return "Не удалось получить номер ценового табло";} 
            else if (LANGUAGE == "TR") {return "Fiyat panosu numarası alınamadı";} 
            else {return "Could not get price board number";}

        case "JSONPTS_ERROR_PRICE_BOARD_NUMBER_OUT_OF_RANGE":
            if (LANGUAGE == "RU") {return "Значение номера ценового табло выходит за допустимые пределы";} 
            else if (LANGUAGE == "TR") {return "Fiyat panosu numarası aralık dışında";} 
            else {return "Price board number is out of range";}

        case "JSONPTS_ERROR_PRICE_BOARD_NOT_CONFIGURED":
            if (LANGUAGE == "RU") {return "Ценовое табло не сконфигурировано";} 
            else if (LANGUAGE == "TR") {return "Fiyat panosu yapılandırılmamış";} 
            else {return "Price board is not configured";}

        case "JSONPTS_ERROR_PUMP_STATUS_NOT_END_OF_TRANSACTION":
            if (LANGUAGE == "RU") {return "ТРК находится не в состоянии конца транзакции";} 
            else if (LANGUAGE == "TR") {return "Pompa durumu işlemin sonu değil";} 
            else {return "Pump status is not an end of transaction";}

        default:
            return stringToLocalize;
    }
}

//-------------------------------------------------------------------------------------
function getVolumeUnit() {
    switch (VOLUME_UNITS) {
        case "L":
        default:
            if (LANGUAGE == "RU") { return "л"; }
            else if (LANGUAGE == "TR") { return "L"; }
            else { return "L"; }
            
        case "G":
        case "gal":
            if (LANGUAGE == "RU") { return "галлон"; }
            else if (LANGUAGE == "TR") { return "gallon"; }
            else { return "gal"; }
    }
}

//-------------------------------------------------------------------------------------
function getTemperatureUnit() {
    switch (TEMPERATURE_UNITS) {
        case "C":
        default:
            if (LANGUAGE == "RU") { return "&deg;C"; }
            else if (LANGUAGE == "TR") { return "&deg;C"; }
            else { return "&deg;C"; }
            
        case "F":
            if (LANGUAGE == "RU") { return "&deg;F"; }
            else if (LANGUAGE == "TR") { return "&deg;F"; }
            else { return "&deg;F"; }
    }
}

//-------------------------------------------------------------------------------------