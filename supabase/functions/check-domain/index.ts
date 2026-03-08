const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ success: false, error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain name
    let cleanDomain = domain.trim().toLowerCase();
    // Remove protocol if present
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    // Remove www
    cleanDomain = cleanDomain.replace(/^www\./, '');
    // Remove trailing slash
    cleanDomain = cleanDomain.replace(/\/$/, '');

    // Add .com if no TLD
    if (!cleanDomain.includes('.')) {
      cleanDomain = `${cleanDomain}.com`;
    }

    console.log('Checking domain:', cleanDomain);

    // Use free RDAP (Registration Data Access Protocol) - successor to WHOIS
    // Try multiple RDAP servers
    const rdapServers = [
      `https://rdap.org/domain/${cleanDomain}`,
      `https://rdap.verisign.com/com/v1/domain/${cleanDomain}`,
    ];

    let available = true;
    let checkedSuccessfully = false;

    for (const server of rdapServers) {
      try {
        const response = await fetch(server, {
          headers: { 'Accept': 'application/rdap+json' },
        });

        if (response.status === 200) {
          // Domain exists (registered)
          available = false;
          checkedSuccessfully = true;
          await response.text(); // consume body
          break;
        } else if (response.status === 404) {
          // Domain not found (available)
          available = true;
          checkedSuccessfully = true;
          await response.text();
          break;
        } else {
          await response.text();
          continue;
        }
      } catch {
        continue;
      }
    }

    // Fallback: DNS lookup via DoH (DNS over HTTPS)
    if (!checkedSuccessfully) {
      try {
        const dnsResponse = await fetch(
          `https://dns.google/resolve?name=${cleanDomain}&type=A`
        );
        const dnsData = await dnsResponse.json();
        
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          available = false;
        } else if (dnsData.Status === 3) {
          // NXDOMAIN - domain doesn't exist
          available = true;
        }
        checkedSuccessfully = true;
      } catch {
        // If all methods fail, return uncertain status
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        domain: cleanDomain,
        available,
        checked: checkedSuccessfully,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking domain:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to check domain' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
