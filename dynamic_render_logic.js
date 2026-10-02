  // Dynamic Dashboard Climate Info Cards
  if (c.climateInformation && Array.isArray(c.climateInformation)) {
    const grid = document.getElementById('climate-info-pillars-grid');
    if (grid) {
      grid.innerHTML = c.climateInformation.map((item, idx) => `
        <div class="info-box-card" onclick="openInfoCardModal('card-${idx}')">
          <div class="info-card-image-box">
            <img src="${item.image || getDefaultInfoCardImage(idx)}" onerror="this.src='https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'" alt="${item.title}" class="info-card-img">
          </div>
          <div class="info-card-body">
            <div class="info-card-title">${item.title}</div>
            <div class="info-card-desc">${item.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Dynamic Response Protocol
  if (c.responseProtocol && Array.isArray(c.responseProtocol)) {
    const protocolList = document.querySelector('.protocol-steps-list');
    if (protocolList) {
      protocolList.innerHTML = c.responseProtocol.map(item => `
        <div class="protocol-step-item">
          <span class="protocol-step-badge">${item.stage}</span>
          <div>
            <div style="font-weight: 700; color: var(--text-main);">${item.title}</div>
            <div style="color: var(--text-muted); font-size: 0.72rem;">${item.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }
