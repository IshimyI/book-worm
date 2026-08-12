function layout({ preheader, heading, bodyHtml, buttonText, buttonUrl, footerNote }) {
  return `
<!doctype html>
<html lang="ru">
  <body style="margin:0; padding:0; background:#e9e4c9; font-family:Georgia,'Times New Roman',serif;">
    <span style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e4c9; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fffdf7; border-radius:16px; overflow:hidden; box-shadow:0 8px 28px rgba(47,42,31,0.18);">
            <tr>
              <td style="background:#2f2a1f; background-image:linear-gradient(135deg,#2f2a1f,#4b5320); padding:32px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:26px; line-height:1;">📚</td>
                    <td style="padding-left:12px;">
                      <div style="font-size:20px; color:#f5f0dc; font-weight:bold; letter-spacing:0.3px;">Книжный червь</div>
                      <div style="font-size:12px; color:#c9c3a5; letter-spacing:0.5px; text-transform:uppercase; margin-top:2px;">читай · оценивай · обсуждай</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 36px 12px;">
                <h1 style="margin:0 0 18px; font-size:22px; color:#2f2a1f;">${heading}</h1>
                <div style="font-size:15px; line-height:1.7; color:#4a4436;">
                  ${bodyHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 12px;" align="center">
                <a href="${buttonUrl}" style="display:inline-block; background:#4b5320; color:#fdfcf5; text-decoration:none; font-size:14px; font-weight:bold; letter-spacing:0.4px; text-transform:uppercase; padding:14px 32px; border-radius:999px; box-shadow:0 4px 14px rgba(75,83,32,0.35);">
                  ${buttonText}
                </a>
                <p style="margin:22px 0 0; font-size:12px; color:#a39c81; word-break:break-all;">
                  Кнопка не работает? Скопируйте ссылку:<br />
                  <a href="${buttonUrl}" style="color:#4b5320;">${buttonUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px;">
                <div style="border-top:1px solid #ece6d0; margin:28px 0 20px;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 32px;">
                <p style="margin:0; font-size:12px; line-height:1.6; color:#a39c81;">${footerNote}</p>
                <p style="margin:14px 0 0; font-size:12px; color:#c9c3a5; font-style:italic;">— Книжный червь, ваш дневник читателя 🐛</p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0; font-size:11px; color:#8a8368;">Это письмо отправлено автоматически, отвечать на него не нужно.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function confirmationEmailHtml(link, name) {
  const greeting = name ? `Привет, ${name}!` : "Привет!";
  return layout({
    preheader: "Подтвердите почту, чтобы открыть доступ к рецензиям и личной книжной полке",
    heading: "Осталось подтвердить почту 🔖",
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting} Рады видеть вас на «Книжном черве» — месте, где книги обсуждают, а не просто читают.</p>
      <p style="margin:0 0 16px;">Подтвердите email, и вам будет доступно:</p>
      <ul style="margin:0 0 16px; padding-left:20px;">
        <li style="margin-bottom:6px;">📖 Своя книжная полка и история прочитанного</li>
        <li style="margin-bottom:6px;">⭐ Оценки и рецензии на любимые (и не очень) книги</li>
        <li style="margin-bottom:6px;">💬 Мнения других читателей — до того, как решите, стоит ли книга времени</li>
      </ul>
      <p style="margin:0;">Одна кнопка — и вы внутри.</p>
    `,
    buttonText: "Подтвердить email",
    buttonUrl: link,
    footerNote: "Ссылка действительна 1 час. Если вы не регистрировались на «Книжном черве» — просто проигнорируйте это письмо, аккаунт не будет создан.",
  });
}

function resetPasswordEmailHtml(link, name) {
  const greeting = name ? `${name}, ` : "";
  return layout({
    preheader: "Ссылка для восстановления пароля на «Книжном черве»",
    heading: "Восстановление пароля 🔑",
    bodyHtml: `
      <p style="margin:0 0 16px;">${greeting}кто-то (надеемся, что вы) запросил сброс пароля на «Книжном черве».</p>
      <p style="margin:0 0 16px;">Нажмите на кнопку ниже, чтобы задать новый пароль и вернуться к чтению.</p>
      <p style="margin:0;">Если это были не вы — аккаунт в безопасности, просто ничего не делайте.</p>
    `,
    buttonText: "Восстановить пароль",
    buttonUrl: link,
    footerNote: "Ссылка действительна 1 час. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо — пароль останется прежним.",
  });
}

module.exports = { confirmationEmailHtml, resetPasswordEmailHtml };
