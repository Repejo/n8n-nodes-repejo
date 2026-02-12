# n8n-nodes-repejo

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

This is an n8n community node that provides integration with [Repejo](https://repejo.se), a donation management platform. It allows you to trigger n8n workflows based on events from your Repejo account such as new donors, donations, and subscription changes.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### GUI installation

1. In n8n, go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-repejo` in **Enter npm package name**
4. Select **Install**
5. Restart your n8n instance

### Manual installation

To install the node locally for development or manual deployment:

1. Navigate to your n8n installation directory
2. Run the following command:
   ```bash
   npm install n8n-nodes-repejo
   ```
3. Restart n8n

## Operations

### Repejo Trigger

Listens for webhook events from Repejo and triggers workflows when specific events occur.

## Node Reference

### Repejo Trigger

#### Node Parameters

- **Events**: Multi-select list of Repejo events to listen for:
  - **Payer Created**: Triggers when a new payer (donor) is created
  - **Payer Updated**: Triggers when payer information is updated
  - **Receivable Created**: Triggers when a new receivable (expected payment) is created
  - **Receivable Updated**: Triggers when receivable status changes
  - **Subscription Created**: Triggers when a new recurring donation is set up
  - **Subscription Updated**: Triggers when subscription details change

- **Webhook Secret** (optional): Secret key for HMAC-SHA256 signature validation
- **Validate Signature**: Enable/disable webhook signature validation (recommended: enabled)

#### Configuration

1. **Set up the webhook in Repejo**:
   - Log into your Repejo account
   - Navigate to webhook settings
   - Add the webhook URL from your n8n trigger node
   - Configure the events you want to receive
   - Set up a webhook secret for security (recommended)

2. **Configure the n8n node**:
   - Select the events you want to listen for
   - Enter the webhook secret if you configured one in Repejo
   - Ensure signature validation is enabled for security

#### Output

The trigger outputs webhook data with the following structure:

```json
{
  "event_type": "payer.created",
  "sent_at": "2024-09-30T19:30:00Z",
  "entity_type": "payer",
  "action": "created",
  "data": {
    "id": "pay_3g9egCWphKfPFoJzOgxpJp",
    "name": "John Doe", 
    "email": "john@example.com",
    "phone": "+46701234567",
    "status": "active",
    "created_at": "2024-09-30T19:30:00Z"
  }
}
```

#### Security Features

- **HMAC-SHA256 Signature Validation**: Verifies webhooks are from Repejo
- **Replay Attack Protection**: Rejects webhooks older than 5 minutes
- **Flexible Signature Headers**: Supports multiple signature header formats

## Example Workflows

### Welcome Email for New Donors

```
Repejo Trigger (payer.created) 
    → Gmail (Send welcome email using {{$json.data.name}} and {{$json.data.email}})
```

### Slack Notification for Large Donations

```
Repejo Trigger (receivable.created) 
    → If ({{$json.data.amount}} > 1000)
        → Slack (Send notification to #donations channel)
```

### CRM Synchronization

```
Repejo Trigger (payer.created, payer.updated)
    → HTTP Request (POST to CRM API with donor data)
        → Set (Update workflow variables)
```

### Monthly Subscription Analytics

```
Repejo Trigger (subscription.created, subscription.updated)
    → Google Sheets (Log subscription changes)
        → Function (Calculate MRR)
```

## Compatibility

This node has been tested with:
- n8n version 1.0.0 and later
- Node.js 18.0.0 and later

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Repejo API documentation](https://repejo.se/docs)
- [Repejo webhook guide](https://repejo.se/docs/webhooks)

## Version history

### 0.1.0
- Initial release
- Repejo Trigger node with webhook support
- HMAC-SHA256 signature validation
- Support for all Repejo webhook events

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)

## Support

### For this community node

If you have issues with this n8n community node:
- Check the [n8n community forum](https://community.n8n.io/)
- Create an issue in the [GitHub repository](https://github.com/repejo/n8n-nodes-repejo)

### For Repejo

For general Repejo questions or API support:
- Visit [Repejo support](https://repejo.se/support)
- Email [support@repejo.se](mailto:support@repejo.se)
