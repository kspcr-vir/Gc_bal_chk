async function check() {
  const res = await fetch('https://mcdindia.woohoo.in/en-gb/balenq');
  const text = await res.text();
  const buttons = text.match(/<button[^>]+>.*<\/button>/g);
  console.log(buttons?.join('\n'));
}
check();
