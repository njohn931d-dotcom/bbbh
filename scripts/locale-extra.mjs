/**
 * Localized "salary to hourly" pages for seven more languages, in the same
 * content model as LOCALE_CONTENT in cluster-content.mjs (and appended to it),
 * so they inherit hreflang, the sitemap, the audit and the content tests.
 *
 * Each page follows the conversion its own country actually uses rather than a
 * translation of the English 2,080-hour rule: Turkey divides by 225 (30 days x
 * 7.5 h), Indonesia by 173, Poland by 168, Vietnam and India by 26 days x 8 h,
 * Italy and the Netherlands by 40 h x 52 weeks. Tables are computed here in the
 * local currency; statutory minimum figures that change every year are
 * deliberately not quoted (each page points to the authority instead).
 *
 * The interactive converter is the same component as on the English pages.
 */

const fmt = (locale, currency, digits = 0) => new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Four-column worked example: annual, monthly, hourly, hours to earn a round amount. */
function table({ locale, currency, head, salaries, hoursPerYear, round }) {
  const big = fmt(locale, currency, 0);
  const small = fmt(locale, currency, ['IDR', 'VND'].includes(currency) ? 0 : 2);
  const hrs = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return {
    head,
    rows: salaries.map(annual => {
      const hourly = annual / hoursPerYear;
      return [big.format(annual), big.format(annual / 12), small.format(hourly), hrs.format(round / hourly)];
    }),
  };
}

const LINKS = ['calculators/salary-to-hourly', 'calculators/cost-of-time', 'calculators/overtime-pay', 'calculators/after-tax-income'];
const PARENT = 'calculators/salary-to-hourly';

const labels = (l) => l; // keeps the label objects greppable

export const EXTRA_LOCALE_CONTENT = [
  // ------------------------------------------------------------------ Italian
  {
    route: 'guides/calcolo-paga-oraria-da-ral-italia', lang: 'it', translationOf: PARENT,
    h1: 'Calcolo della paga oraria: da RAL a tariffa oraria lorda',
    title: 'Calcolo paga oraria: da RAL a tariffa oraria lorda',
    desc: 'Trasforma la RAL in paga oraria lorda, giornaliera e mensile. Calcolatore gratuito in euro, nel browser e senza registrazione.',
    intent: 'guide',
    intro: 'Una RAL, la retribuzione annua lorda, dice poco su quanto vale un\'ora del tuo lavoro. Qui la converti in paga oraria, giornaliera e mensile e vedi quante ore servono per una spesa.',
    formula: { name: 'Paga oraria lorda', expr: 'Paga oraria = RAL ÷ (ore settimanali × 52)', plain: 'Con 40 ore settimanali il divisore è 2.080 ore l\'anno, cioè circa 173 ore al mese. Il divisore orario effettivo dipende dal CCNL applicato al tuo contratto.' },
    assumptions: 'Esempi con 40 ore settimanali e 52 settimane, valori al lordo di imposte e contributi.',
    caveat: 'In Italia non esiste un salario minimo legale nazionale: i minimi sono fissati dai contratti collettivi (CCNL). Controlla il tuo CCNL e il tuo contratto.',
    table: table({ locale: 'it-IT', currency: 'EUR', head: ['RAL (annua lorda)', 'Mensile lordo (RAL ÷ 12)', 'Paga oraria lorda', 'Ore di lavoro per guadagnare 100 €'], salaries: [20000, 28000, 35000, 50000], hoursPerYear: 2080, round: 100 }),
    notes: [
      'Molti contratti prevedono la tredicesima e spesso la quattordicesima. La RAL le include, quindi la retribuzione lorda di un singolo mese può essere la RAL divisa per 13 o 14 e non per 12.',
      'Lo stipendio netto dipende da IRPEF, addizionali e contributi. Per il netto usa il cedolino o un simulatore ufficiale: questa pagina calcola solo il lordo.',
    ],
    faqs: [
      ['Come si calcola la paga oraria dalla RAL?', 'Dividi la RAL per le ore lavorate in un anno: con 40 ore settimanali sono 2.080. Esempio: 35.000 € ÷ 2.080 = 16,83 € lordi all\'ora.'],
      ['Qual è il salario minimo in Italia?', 'Non esiste un minimo legale nazionale. I minimi retributivi sono stabiliti dai contratti collettivi nazionali (CCNL) di ciascun settore.'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 35000, period: 'year', locale: 'it-IT', currency: 'EUR', hoursPerWeek: 40, weeksPerYear: 52, price: 100, heading: 'h2', labels: labels({
      title: 'Convertitore di stipendio', intro: 'Cambia un valore qualsiasi. I calcoli avvengono nel tuo browser e nulla viene inviato.', amount: 'Importo',
      per: { hour: 'all\'ora', day: 'al giorno', week: 'a settimana', biweek: 'ogni 2 settimane', month: 'al mese', year: 'all\'anno' },
      hoursPerWeek: 'Ore a settimana', weeksPerYear: 'Settimane all\'anno',
      out: { hourly: 'Orario', daily: 'Giornaliero', weekly: 'Settimanale', biweekly: 'Ogni 2 settimane', monthly: 'Mensile', annual: 'Annuale' },
      price: 'Una spesa da', priceHours: 'Sono circa {h} ore di lavoro a questa paga, al lordo.' }) },
  },
  // -------------------------------------------------------------------- Dutch
  {
    route: 'guides/uurloon-berekenen-van-jaarsalaris-nederland', lang: 'nl', translationOf: PARENT,
    h1: 'Uurloon berekenen: van maandsalaris naar bruto uurloon',
    title: 'Uurloon berekenen: van jaarsalaris naar bruto uurloon',
    desc: 'Reken je maand- of jaarsalaris om naar bruto uurloon, dagloon en weekloon. Gratis rekenhulp in euro, draait in je browser.',
    intent: 'guide',
    intro: 'Een bruto maandsalaris zegt weinig over wat een uur van je tijd oplevert. Hier reken je het om naar uurloon, dagloon en weekloon en zie je hoeveel uur werken een uitgave kost.',
    formula: { name: 'Bruto uurloon', expr: 'Uurloon = (maandsalaris × 12) ÷ (52 × uren per week)', plain: 'Dit is de gangbare omrekening. Vakantiegeld en een eventuele dertiende maand reken je apart mee als ze niet al in het maandsalaris zitten.' },
    assumptions: 'Voorbeelden met een werkweek van 40 uur en 52 weken, bruto bedragen.',
    caveat: 'Het wettelijk minimumloon wordt regelmatig aangepast. Controleer het actuele bedrag op rijksoverheid.nl.',
    table: table({ locale: 'nl-NL', currency: 'EUR', head: ['Bruto jaarsalaris', 'Bruto per maand', 'Bruto uurloon', 'Uren werken voor € 100'], salaries: [30000, 42000, 55000, 75000], hoursPerYear: 2080, round: 100 }),
    notes: [
      'Een volledige werkweek is 36 tot 40 uur, afhankelijk van je cao of contract. Met 36 uur per week deel je door 1.872 uur in plaats van 2.080, en dat maakt je uurloon hoger.',
      'Vakantiegeld is vaak 8% van het bruto jaarloon en komt dan bovenop je maandsalaris. Reken het mee als je het jaarloon met je uurloon wilt vergelijken.',
    ],
    faqs: [
      ['Hoe bereken ik mijn uurloon?', 'Vermenigvuldig je bruto maandsalaris met 12 en deel door 52 keer je uren per week. Bij 3.500 € per maand en 40 uur is dat 42.000 ÷ 2.080 = 20,19 € per uur.'],
      ['Zit vakantiegeld in het uurloon?', 'Meestal niet. Vakantiegeld komt vaak bovenop het bruto loon, tenzij je werkgever het in het uurloon verrekent. Kijk op je loonstrook of in je contract.'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 3500, period: 'month', locale: 'nl-NL', currency: 'EUR', hoursPerWeek: 40, weeksPerYear: 52, price: 100, heading: 'h2', labels: labels({
      title: 'Uurloon omrekenen', intro: 'Pas een getal aan. Alles wordt in je browser berekend en er wordt niets verzonden.', amount: 'Bedrag',
      per: { hour: 'per uur', day: 'per dag', week: 'per week', biweek: 'per 2 weken', month: 'per maand', year: 'per jaar' },
      hoursPerWeek: 'Uren per week', weeksPerYear: 'Weken per jaar',
      out: { hourly: 'Per uur', daily: 'Per dag', weekly: 'Per week', biweekly: 'Per 2 weken', monthly: 'Per maand', annual: 'Per jaar' },
      price: 'Een aankoop van', priceHours: 'Dat is ongeveer {h} uur werken tegen dit loon, bruto.' }) },
  },
  // ------------------------------------------------------------------- Polish
  {
    route: 'guides/kalkulator-stawki-godzinowej-brutto-polska', lang: 'pl', translationOf: PARENT,
    h1: 'Kalkulator stawki godzinowej: z pensji brutto na godzinę',
    title: 'Kalkulator stawki godzinowej: z pensji brutto na godzinę',
    desc: 'Przelicz pensję miesięczną lub roczną na stawkę godzinową brutto, dzienną i tygodniową. Darmowy kalkulator w złotych, działa w przeglądarce.',
    intent: 'guide',
    intro: 'Pensja brutto w skali miesiąca niewiele mówi o wartości godziny Twojej pracy. Tutaj przeliczysz ją na stawkę godzinową, dzienną i tygodniową i zobaczysz, ile godzin pracy kosztuje wydatek.',
    formula: { name: 'Stawka godzinowa brutto', expr: 'Stawka = pensja miesięczna ÷ 168', plain: 'W przybliżeniu miesiąc to 21 dni roboczych po 8 godzin, czyli 168 godzin. Dokładna liczba godzin zależy od kalendarza i od świąt w danym miesiącu.' },
    assumptions: 'Przykłady przy pełnym etacie i 168 godzinach w miesiącu, kwoty brutto.',
    caveat: 'Minimalne wynagrodzenie i minimalna stawka godzinowa są co roku aktualizowane. Sprawdź aktualne kwoty na stronie rządowej.',
    table: table({ locale: 'pl-PL', currency: 'PLN', head: ['Pensja roczna brutto', 'Miesięcznie brutto', 'Stawka godzinowa brutto', 'Godziny pracy na 100 zł'], salaries: [60000, 90000, 120000, 180000], hoursPerYear: 2016, round: 100 }),
    notes: [
      'Za nadgodziny Kodeks pracy przewiduje dodatek 100% w nocy, w niedziele i święta oraz w dni wolne, a w pozostałych przypadkach 50%.',
      'Pensja netto zależy od składek ZUS, podatku i kosztów uzyskania przychodu. Ta strona liczy tylko kwoty brutto.',
    ],
    faqs: [
      ['Jak przeliczyć pensję na stawkę godzinową?', 'Podziel miesięczne wynagrodzenie brutto przez 168. Przykład: 8 000 zł ÷ 168 = 47,62 zł brutto za godzinę.'],
      ['Ile godzin ma miesiąc pracy?', 'Przy pełnym etacie średnio przyjmuje się 168 godzin, ale w konkretnym miesiącu może ich być więcej lub mniej, zależnie od liczby dni roboczych.'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 8000, period: 'month', locale: 'pl-PL', currency: 'PLN', hoursPerMonth: 168, dayHours: 8, price: 100, heading: 'h2', labels: labels({
      title: 'Przelicznik wynagrodzenia', intro: 'Zmień dowolną wartość. Obliczenia odbywają się w przeglądarce, nic nie jest wysyłane.', amount: 'Kwota',
      per: { hour: 'za godzinę', day: 'za dzień', week: 'za tydzień', biweek: 'za 2 tygodnie', month: 'za miesiąc', year: 'za rok' },
      hoursPerMonth: 'Godziny w miesiącu',
      out: { hourly: 'Za godzinę', daily: 'Dziennie', weekly: 'Tygodniowo', biweekly: 'Co 2 tygodnie', monthly: 'Miesięcznie', annual: 'Rocznie' },
      price: 'Wydatek w wysokości', priceHours: 'To około {h} godz. pracy przy tej stawce brutto.' }) },
  },
  // ------------------------------------------------------------------ Turkish
  {
    route: 'guides/saatlik-ucret-hesaplama-aylik-maastan-turkiye', lang: 'tr', translationOf: PARENT,
    h1: 'Saatlik ücret hesaplama: aylık maaştan saatlik ücrete',
    title: 'Saatlik ücret hesaplama: aylık maaştan saatlik ücrete',
    desc: 'Aylık veya yıllık brüt maaşınızı saatlik, günlük ve haftalık ücrete çevirin. Ücretsiz, tarayıcıda çalışan hesaplayıcı, liralı örneklerle.',
    intent: 'guide',
    intro: 'Aylık brüt maaş, bir saatlik emeğinizin değerini göstermez. Burada maaşınızı saatlik, günlük ve haftalık ücrete çevirir, bir harcamanın kaç saatlik çalışmaya denk geldiğini görürsünüz.',
    formula: { name: 'Saatlik brüt ücret', expr: 'Saatlik ücret = aylık ücret ÷ 225', plain: 'Aylık ücretli çalışanlarda ay 30 gün, günlük çalışma 7,5 saat sayılır: 30 × 7,5 = 225 saat. Haftalık çalışma süresi en çok 45 saattir.' },
    assumptions: 'Örnekler 225 saatlik aylık bölenle ve brüt tutarlarla hesaplanmıştır.',
    caveat: 'Asgari ücret her yıl güncellenir. Güncel tutarı Çalışma ve Sosyal Güvenlik Bakanlığı\'ndan kontrol edin.',
    table: table({ locale: 'tr-TR', currency: 'TRY', head: ['Yıllık brüt', 'Aylık brüt', 'Saatlik brüt', '1.000 ₺ için gereken çalışma saati'], salaries: [500000, 800000, 1200000, 2000000], hoursPerYear: 2700, round: 1000 }),
    notes: [
      'Haftalık 45 saati aşan çalışma fazla mesaidir ve saatlik ücretin yüzde elli artırılmış haliyle ödenir.',
      'Net maaş gelir vergisi ve sigorta primi kesintilerine bağlıdır. Bu sayfa yalnızca brüt tutarları hesaplar; net için bordronuza bakın.',
    ],
    faqs: [
      ['Saatlik ücret nasıl hesaplanır?', 'Aylık brüt ücreti 225\'e bölün. Örnek: 45.000 ₺ ÷ 225 = 200 ₺ brüt saatlik ücret.'],
      ['Fazla mesai ücreti nasıl hesaplanır?', 'Saatlik ücret yüzde elli artırılarak ödenir. 200 ₺ saatlik ücret için bir saatlik fazla mesai 300 ₺ eder.'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 45000, period: 'month', locale: 'tr-TR', currency: 'TRY', hoursPerMonth: 225, dayHours: 7.5, price: 1000, heading: 'h2', labels: labels({
      title: 'Ücret dönüştürücü', intro: 'Herhangi bir değeri değiştirin. Hesaplama tarayıcınızda yapılır, hiçbir şey gönderilmez.', amount: 'Tutar',
      per: { hour: 'saatlik', day: 'günlük', week: 'haftalık', biweek: '2 haftalık', month: 'aylık', year: 'yıllık' },
      hoursPerMonth: 'Aylık saat',
      out: { hourly: 'Saatlik', daily: 'Günlük', weekly: 'Haftalık', biweekly: '2 haftalık', monthly: 'Aylık', annual: 'Yıllık' },
      price: 'Şu tutarda bir harcama', priceHours: 'Bu ücretle brüt yaklaşık {h} saatlik çalışmaya denk gelir.' }) },
  },
  // --------------------------------------------------------------- Indonesian
  {
    route: 'guides/cara-menghitung-gaji-per-jam-indonesia', lang: 'id', translationOf: PARENT,
    h1: 'Cara menghitung gaji per jam dari gaji bulanan',
    title: 'Cara menghitung gaji per jam dari gaji bulanan',
    desc: 'Ubah gaji bulanan atau tahunan menjadi upah per jam, per hari, dan per minggu. Kalkulator gratis dalam rupiah, berjalan di browser.',
    intent: 'guide',
    intro: 'Gaji bulanan tidak menunjukkan berapa nilai satu jam kerja Anda. Di sini Anda mengubahnya menjadi upah per jam, per hari, dan per minggu, lalu melihat berapa jam kerja yang dibutuhkan untuk suatu pengeluaran.',
    formula: { name: 'Upah sejam', expr: 'Upah sejam = 1/173 × upah sebulan', plain: 'Angka 173 berasal dari 40 jam per minggu × 52 minggu ÷ 12 bulan. Rumus ini juga dipakai untuk menghitung upah lembur di Indonesia.' },
    assumptions: 'Contoh dihitung dengan pembagi 173 jam per bulan dan angka sebelum pajak.',
    caveat: 'Upah minimum berbeda di setiap provinsi dan kabupaten atau kota, dan berubah tiap tahun. Periksa ketetapan terbaru dari pemerintah daerah Anda.',
    table: table({ locale: 'id-ID', currency: 'IDR', head: ['Gaji per tahun', 'Gaji per bulan', 'Upah per jam (1/173)', 'Jam kerja untuk Rp 100.000'], salaries: [60000000, 120000000, 240000000, 480000000], hoursPerYear: 2076, round: 100000 }),
    notes: [
      'Lembur pada hari kerja dibayar 1,5 kali upah sejam untuk jam pertama dan 2 kali untuk jam berikutnya.',
      'Upah sebulan dalam rumus ini adalah upah pokok ditambah tunjangan tetap. THR, bonus, dan tunjangan tidak tetap tidak termasuk.',
    ],
    faqs: [
      ['Bagaimana rumus upah per jam?', 'Bagi upah sebulan dengan 173. Contoh: Rp 8.000.000 ÷ 173 = Rp 46.243 per jam.'],
      ['Berapa upah lembur per jam?', 'Jam lembur pertama pada hari kerja dibayar 1,5 × upah sejam dan jam berikutnya 2 ×. Dengan upah sejam Rp 46.243, jam pertama lembur Rp 69.364 dan jam kedua Rp 92.486.'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 8000000, period: 'month', locale: 'id-ID', currency: 'IDR', hoursPerMonth: 173, dayHours: 8, price: 100000, heading: 'h2', labels: labels({
      title: 'Konverter gaji', intro: 'Ubah angka apa pun. Perhitungan dilakukan di browser Anda dan tidak ada yang dikirim.', amount: 'Jumlah',
      per: { hour: 'per jam', day: 'per hari', week: 'per minggu', biweek: 'per 2 minggu', month: 'per bulan', year: 'per tahun' },
      hoursPerMonth: 'Jam per bulan',
      out: { hourly: 'Per jam', daily: 'Per hari', weekly: 'Per minggu', biweekly: 'Per 2 minggu', monthly: 'Per bulan', annual: 'Per tahun' },
      price: 'Pengeluaran sebesar', priceHours: 'Setara sekitar {h} jam kerja dengan gaji ini, sebelum pajak.' }) },
  },
  // --------------------------------------------------------------- Vietnamese
  {
    route: 'guides/cach-tinh-luong-theo-gio-viet-nam', lang: 'vi', translationOf: PARENT,
    h1: 'Cách tính lương theo giờ từ lương tháng',
    title: 'Cách tính lương theo giờ từ lương tháng (có ví dụ)',
    desc: 'Quy đổi lương tháng hoặc lương năm sang lương theo giờ, theo ngày và theo tuần. Công cụ miễn phí bằng đồng, chạy ngay trong trình duyệt.',
    intent: 'guide',
    intro: 'Lương tháng không cho biết một giờ làm việc của bạn đáng giá bao nhiêu. Ở đây bạn quy đổi sang lương theo giờ, theo ngày và theo tuần, rồi xem một khoản chi bằng bao nhiêu giờ làm việc.',
    formula: { name: 'Lương theo giờ', expr: 'Lương giờ = lương tháng ÷ (26 ngày × 8 giờ)', plain: 'Nhiều doanh nghiệp tính 26 ngày công chuẩn mỗi tháng. Nếu làm 5 ngày một tuần, có thể dùng khoảng 22 ngày, tức 176 giờ.' },
    assumptions: 'Ví dụ tính với 208 giờ mỗi tháng (26 ngày × 8 giờ), số tiền trước thuế.',
    caveat: 'Lương tối thiểu vùng khác nhau theo từng vùng và thay đổi theo từng năm. Hãy kiểm tra quy định mới nhất.',
    table: table({ locale: 'vi-VN', currency: 'VND', head: ['Lương năm', 'Lương tháng', 'Lương giờ (208 giờ/tháng)', 'Số giờ làm để có 100.000 ₫'], salaries: [120000000, 240000000, 480000000, 960000000], hoursPerYear: 2496, round: 100000 }),
    notes: [
      'Làm thêm giờ được trả ít nhất 150% lương giờ vào ngày thường, 200% vào ngày nghỉ hằng tuần và 300% vào ngày lễ, Tết, chưa kể tiền lương của ngày nghỉ có hưởng lương.',
      'Lương thực nhận còn phụ thuộc bảo hiểm xã hội và thuế thu nhập cá nhân. Trang này chỉ tính số tiền trước khi trừ các khoản đó.',
    ],
    faqs: [
      ['Lương theo giờ tính thế nào?', 'Lấy lương tháng chia cho số giờ làm việc bình thường trong tháng. Ví dụ 15.000.000 ₫ ÷ 208 giờ = 72.115 ₫ mỗi giờ.'],
      ['Tiền làm thêm giờ tính ra sao?', 'Với lương giờ 72.115 ₫, một giờ làm thêm vào ngày thường được trả ít nhất 108.173 ₫, tức 150%.'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 15000000, period: 'month', locale: 'vi-VN', currency: 'VND', hoursPerMonth: 208, dayHours: 8, price: 100000, heading: 'h2', labels: labels({
      title: 'Công cụ quy đổi lương', intro: 'Thay đổi bất kỳ con số nào. Mọi phép tính diễn ra trong trình duyệt của bạn, không gửi dữ liệu đi đâu.', amount: 'Số tiền',
      per: { hour: 'mỗi giờ', day: 'mỗi ngày', week: 'mỗi tuần', biweek: 'mỗi 2 tuần', month: 'mỗi tháng', year: 'mỗi năm' },
      hoursPerMonth: 'Số giờ mỗi tháng',
      out: { hourly: 'Theo giờ', daily: 'Theo ngày', weekly: 'Theo tuần', biweekly: 'Mỗi 2 tuần', monthly: 'Theo tháng', annual: 'Theo năm' },
      price: 'Một khoản chi', priceHours: 'Tương đương khoảng {h} giờ làm việc với mức lương này, trước thuế.' }) },
  },
  // -------------------------------------------------------------------- Hindi
  {
    route: 'guides/ghante-ke-hisab-se-vetan-calculator-india', lang: 'hi', translationOf: PARENT,
    h1: 'प्रति घंटा वेतन कैलकुलेटर: मासिक वेतन से घंटे की दर',
    title: 'प्रति घंटा वेतन कैलकुलेटर: मासिक वेतन से घंटे की दर',
    desc: 'मासिक या वार्षिक वेतन को प्रति घंटा, प्रति दिन और प्रति सप्ताह में बदलें। रुपये में मुफ़्त कैलकुलेटर, आपके ब्राउज़र में चलता है।',
    intent: 'guide',
    intro: 'मासिक वेतन से यह पता नहीं चलता कि आपके काम के एक घंटे की कीमत क्या है। यहाँ आप उसे प्रति घंटा, प्रति दिन और प्रति सप्ताह की दर में बदलते हैं और देखते हैं कि कोई खर्च कितने घंटे के काम के बराबर है।',
    formula: { name: 'घंटे की दर', expr: 'घंटे की दर = मासिक वेतन ÷ (26 दिन × 8 घंटे)', plain: 'न्यूनतम मज़दूरी की गणना में अक्सर महीने के 26 कार्य-दिवस और रोज़ 8 घंटे माने जाते हैं। आपके नियोक्ता की गणना अलग हो सकती है।' },
    assumptions: 'उदाहरण 208 घंटे प्रति माह (26 दिन × 8 घंटे) और कर से पहले की राशि पर आधारित हैं।',
    caveat: 'न्यूनतम मज़दूरी राज्य और काम के प्रकार के अनुसार अलग होती है और बदलती रहती है। ताज़ा दर अपने राज्य के श्रम विभाग से जाँचें।',
    table: table({ locale: 'hi-IN', currency: 'INR', head: ['वार्षिक वेतन', 'मासिक वेतन', 'घंटे की दर (208 घंटे/माह)', '₹500 के लिए काम के घंटे'], salaries: [300000, 600000, 1200000, 2400000], hoursPerYear: 2496, round: 500 }),
    notes: [
      'कारखाना अधिनियम, 1948 के अनुसार कारखानों में ओवरटाइम सामान्य दर से दोगुनी दर पर मिलता है। अन्य क्षेत्रों में राज्य के नियम लागू होते हैं।',
      'हाथ में आने वाला वेतन भविष्य निधि (पीएफ), आयकर और अन्य कटौतियों पर निर्भर करता है। यह पेज केवल कटौती से पहले की राशि निकालता है।',
    ],
    faqs: [
      ['प्रति घंटा वेतन कैसे निकालें?', 'मासिक वेतन को 208 से भाग दें। उदाहरण: ₹30,000 ÷ 208 = ₹144.23 प्रति घंटा।'],
      ['ओवरटाइम की दर क्या होती है?', 'कारखानों में सामान्य दर की दोगुनी। ₹144.23 की दर पर ओवरटाइम का एक घंटा ₹288.46 बनता है।'],
    ],
    links: LINKS, related: LINKS,
    widget: { amount: 30000, period: 'month', locale: 'hi-IN', currency: 'INR', hoursPerMonth: 208, dayHours: 8, price: 500, heading: 'h2', labels: labels({
      title: 'वेतन कन्वर्टर', intro: 'कोई भी संख्या बदलें। सारी गणना आपके ब्राउज़र में होती है, कुछ भी कहीं नहीं भेजा जाता।', amount: 'राशि',
      per: { hour: 'प्रति घंटा', day: 'प्रति दिन', week: 'प्रति सप्ताह', biweek: 'हर 2 सप्ताह', month: 'प्रति माह', year: 'प्रति वर्ष' },
      hoursPerMonth: 'प्रति माह घंटे',
      out: { hourly: 'प्रति घंटा', daily: 'प्रति दिन', weekly: 'प्रति सप्ताह', biweekly: 'हर 2 सप्ताह', monthly: 'प्रति माह', annual: 'प्रति वर्ष' },
      price: 'एक खर्च', priceHours: 'इस वेतन पर यह लगभग {h} घंटे के काम के बराबर है (कर से पहले)।' }) },
  },
];
