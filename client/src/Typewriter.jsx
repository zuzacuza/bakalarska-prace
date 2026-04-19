import React, { useState, useEffect } from 'react';

//component for sequential display of text
const Typewriter = ({ text, speed = 25 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!text) return;

    setDisplayedText('');
    let currentText = '';
    let i = 0;

    const timer = setInterval(() => {
      if (i < text.length) {
        currentText += text[i];
        setDisplayedText(currentText);
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default Typewriter;