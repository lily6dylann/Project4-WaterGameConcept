import React, { useState, useEffect } from 'react';

const facts = [
  "1 in 10 people lack access to clean water.",
  "Women and girls spend 200 million hours every day collecting water.",
  "Every $1 invested in clean water can yield $4–$12 in economic returns.",
  "Unsafe water kills more people each year than all forms of violence, including war."
];

export default function WaterFact({ round }) {
  // Rotate fact every round
  const factIndex = round % facts.length;
  return (
    <div className="water-fact-card">
      <h4>💧 Water Fact</h4>
      <p>{facts[factIndex]}</p>
    </div>
  );
}